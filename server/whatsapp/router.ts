import { WhatsAppNormalizedMessage, WhatsAppConnection, AIToolExecutionResult } from '../../src/types';
import { getWhatsAppProvider } from './provider';
import { WhatsAppLinkingService } from './linking';
import { WhatsAppDeduplication } from './deduplication';
import { extractTextIntent } from './normalizer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

let supabaseAdmin: SupabaseClient | null = null;
function getDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  if (!supabaseAdmin) supabaseAdmin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return supabaseAdmin;
}

interface RoutingResult {
  success: boolean;
  replied: boolean;
  error?: string;
  toolInvoked?: string;
}

export async function routeMessage(message: WhatsAppNormalizedMessage): Promise<RoutingResult> {
  const requestId = 'req_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
  const start = Date.now();

  try {
    const isDuplicate = await WhatsAppDeduplication.isProcessed(message.messageId);
    if (isDuplicate) return { success: true, replied: false };

    const connection = await WhatsAppLinkingService.getConnectionByExternalId(message.senderId);
    if (!connection) {
      await handleUnlinkedUser(message);
      await WhatsAppDeduplication.markProcessed(message.messageId, message.senderId, 'unlinked_sent');
      return { success: true, replied: true };
    }

    if (connection.status === 'disconnected') {
      await sendReply(message.senderId, 'en', 'This WhatsApp account has been disconnected. Please reconnect from the app.');
      await WhatsAppDeduplication.markProcessed(message.messageId, message.senderId, 'disconnected_sent');
      return { success: true, replied: true };
    }

    await WhatsAppLinkingService.updateLastMessage(message.senderId);

    const detectedLang = detectLanguage(message.text || message.media?.caption || '');
    if (detectedLang && detectedLang !== connection.language) {
      await WhatsAppLinkingService.updateLanguage(message.senderId, detectedLang);
    }
    const lang = detectedLang || connection.language || 'en';

    let result: RoutingResult;
    if (message.type === 'image') {
      result = await handleImageMessage(message, connection, lang);
    } else {
      result = await handleTextMessage(message, connection, lang);
    }

    const duration = Date.now() - start;
    console.log(JSON.stringify({
      level: 'INFO', module: 'whatsapp_router', requestId,
      senderHash: hashForLog(message.senderId), messageId: message.messageId,
      type: message.type, toolInvoked: result.toolInvoked, duration, status: result.success ? 'ok' : 'error',
    }));

    await WhatsAppDeduplication.markProcessed(message.messageId, message.senderId, result.success ? 'processed' : 'failed');
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(JSON.stringify({ level: 'ERROR', module: 'whatsapp_router', requestId, error: errorMsg }));
    await WhatsAppDeduplication.markFailed(message.messageId, message.senderId, errorMsg);
    await sendReply(message.senderId, 'en', 'Sorry, something went wrong. Please try again.');
    return { success: false, replied: true, error: errorMsg };
  }
}

async function handleTextMessage(
  message: WhatsAppNormalizedMessage,
  connection: WhatsAppConnection,
  lang: 'en' | 'ar'
): Promise<RoutingResult> {
  const text = message.text || '';
  const { command } = extractTextIntent(text);

  switch (command) {
    case 'connect':
      return handleConnectCommand(message, lang);
    case 'disconnect':
      return handleDisconnectCommand(message, connection, lang);
    case 'daily_summary':
      return handleDailySummary(message.senderId, connection.profileId, lang);
    case 'weekly_report':
      return handleWeeklyReport(message.senderId, connection.profileId, lang);
    case 'progress':
      return handleProgressQuery(message.senderId, connection.profileId, lang);
    case 'confirm':
      return handleConfirmCommand(message.senderId, lang);
    case 'cancel':
      return handleCancelCommand(message.senderId, lang);
    case 'message':
    default:
      return handleAICoachMessage(text, message.senderId, connection, lang);
  }
}

async function handleAICoachMessage(
  text: string,
  senderId: string,
  connection: WhatsAppConnection,
  lang: 'en' | 'ar'
): Promise<RoutingResult> {
  const profileId = connection.profileId;

  let contextStr = '';
  try {
    const { AIContextBuilder } = await import('../../src/services/aiContextBuilder');
    contextStr = await AIContextBuilder.buildContext({ userId: profileId, language: lang });
  } catch {
    contextStr = JSON.stringify({ locale: lang });
  }

  const conversationId = 'wa_conv_' + connection.id;
  const db = getDb();

  // Ensure conversation exists in Supabase
  const { data: existingConv } = await db
    .from('ai_conversations')
    .select('id')
    .eq('id', conversationId)
    .single();

  if (!existingConv) {
    await db.from('ai_conversations').insert({
      id: conversationId,
      user_id: profileId,
      title: 'WhatsApp Chat',
      title_ar: 'محادثة واتساب',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    });
  }

  // Store user message
  const userMsgId = 'msg_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
  await db.from('ai_messages').insert({
    id: userMsgId,
    conversation_id: conversationId,
    role: 'user',
    content: text,
    created_at: new Date().toISOString(),
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallbackReply = lang === 'ar'
      ? 'تمام، أنا جاهز أساعدك! ابعتلي وجبة أو وزن أو أي حاجة عايز تسجلها.'
      : 'Got it! I\'m ready to help. Send me a meal, weight, or anything you want to log.';
    await sendReply(senderId, lang, fallbackReply);
    await storeAssistantMessage(db, conversationId, fallbackReply);
    return { success: true, replied: true };
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'whatsapp-bot' } } });

    const toolDeclarations = await buildToolDeclarations();

    // Get conversation history from Supabase
    const { data: historyRows } = await db
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    const contents = (historyRows || [])
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text }] });
    }

    const systemInstruction = `You are AI Fitness OS, a personalized AI fitness and nutrition coach communicating via WhatsApp.

USER CONTEXT (REAL DATA):
${contextStr}

RULES:
- Respond in ${lang === 'ar' ? 'Arabic (natural, concise WhatsApp style)' : 'English (natural, concise WhatsApp style)'}.
- Use real data from USER CONTEXT. Do NOT invent numbers.
- Use tools when you need to read or write data.
- Only use write tools when the user explicitly asks to log something.
- Be supportive, concise, and actionable.
- Keep responses short for WhatsApp (1-3 sentences max).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents,
      config: { systemInstruction, temperature: 0.7, tools: [{ functionDeclarations: toolDeclarations }] },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const responseText = part?.text || '';
    const toolCall = part?.functionCall;

    if (toolCall) {
      const { getTool } = await import('../../src/services/aiTools');
      const toolDef = getTool(toolCall.name);
      if (toolDef) {
        let validatedArgs;
        try {
          validatedArgs = toolDef.schema.parse(toolCall.args || {});
        } catch {
          const clarification = lang === 'ar' ? 'محتاج أفهم أكتر، ممكن توضّح؟' : 'Could you clarify that?';
          await sendReply(senderId, lang, clarification);
          await storeAssistantMessage(db, conversationId, clarification);
          return { success: true, replied: true, toolInvoked: toolCall.name };
        }

        const result = await toolDef.execute(validatedArgs, profileId, lang);
        const replyText = (responseText + ' ' + result.message).trim();

        if (result.requiresConfirmation && result.confirmationPayload) {
          await sendReply(senderId, lang, replyText + '\n\n' + (lang === 'ar' ? '1 للتأكيد، 2 للإلغاء' : 'Type 1 to confirm, 2 to cancel'));
        } else {
          await sendReply(senderId, lang, replyText);
        }

        await storeAssistantMessage(db, conversationId, replyText, toolCall.name, result);
        return { success: true, replied: true, toolInvoked: toolCall.name };
      }
    }

    await sendReply(senderId, lang, responseText);
    await storeAssistantMessage(db, conversationId, responseText);
    return { success: true, replied: true };
  } catch (err) {
    console.error('AI Coach error in WhatsApp:', err);
    const fallback = lang === 'ar' ? 'في مشكلة دلوقتي، ممكن تاني؟' : 'Having trouble right now, please try again.';
    await sendReply(senderId, lang, fallback);
    return { success: false, replied: true, error: err instanceof Error ? err.message : 'AI error' };
  }
}

async function handleImageMessage(
  message: WhatsAppNormalizedMessage,
  connection: WhatsAppConnection,
  lang: 'en' | 'ar'
): Promise<RoutingResult> {
  const provider = getWhatsAppProvider();

  try {
    const mediaId = message.media?.url || '';
    const { mimeType, data } = await provider.downloadMedia(mediaId);

    if (!mimeType.startsWith('image/')) {
      await sendReply(message.senderId, lang, lang === 'ar' ? 'محتاج صورة أكل عشان أحللها.' : 'I need a food image to analyze.');
      return { success: true, replied: true };
    }

    const imageBase64 = data.toString('base64');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      await sendReply(message.senderId, lang, lang === 'ar' ? 'مش قادر أحلل الصورة دلوقتي.' : 'Cannot analyze images right now.');
      return { success: true, replied: true };
    }

    const res = await fetch('http://localhost:3000/api/ai/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.WHATSAPP_INTERNAL_TOKEN || 'whatsapp_internal'}` },
      body: JSON.stringify({ imageBase64, mimeType, language: lang, mode: 'image' }),
    });

    if (!res.ok) {
      await sendReply(message.senderId, lang, lang === 'ar' ? 'مقدرتش أحلل الصورة، ممكن تاني؟' : 'Could not analyze the image, please try again.');
      return { success: true, replied: true };
    }

    const analysis = await res.json();
    const items = analysis.items || [];
    const totalCal = analysis.totalCalories || 0;
    const confidence = analysis.confidence || 0;

    if (confidence < 0.6 || items.length === 0) {
      await sendReply(message.senderId, lang, lang === 'ar' ? 'مش متأكد أوي عن الأكل اللي في الصورة. ممكن تكتبهولي؟' : 'I\'m not sure about the food. Could you type what you ate?');
      return { success: true, replied: true };
    }

    const itemNames = items.map((i: { name: string }) => i.name).join(', ');
    const confirmationMsg = lang === 'ar'
      ? `قدرت الوجبة: ${itemNames}\nالسعرات: ~${totalCal} kcal\n\n1 للتأكيد، 2 للإلغاء`
      : `Detected: ${itemNames}\nCalories: ~${totalCal} kcal\n\nType 1 to confirm, 2 to cancel`;

    // Store pending meal in Supabase
    const db = getDb();
    await db.from('pending_whatsapp_meals').insert({
      id: 'pending_' + Date.now().toString(36),
      profile_id: connection.profileId,
      items: JSON.stringify(items),
      total_calories: totalCal,
      total_protein: analysis.totalProtein || 0,
      total_carbs: analysis.totalCarbs || 0,
      total_fat: analysis.totalFat || 0,
      confidence,
      source: 'whatsapp_image',
      created_at: new Date().toISOString(),
    });

    await sendReply(message.senderId, lang, confirmationMsg);
    return { success: true, replied: true, toolInvoked: 'analyze_food' };
  } catch (err) {
    console.error('Image analysis error:', err);
    await sendReply(message.senderId, lang, lang === 'ar' ? 'في مشكلة في تحليل الصورة.' : 'There was an issue analyzing the image.');
    return { success: false, replied: true, error: err instanceof Error ? err.message : 'Image error' };
  }
}

async function handleConnectCommand(message: WhatsAppNormalizedMessage, lang: 'en' | 'ar'): Promise<RoutingResult> {
  await sendReply(message.senderId, lang, lang === 'ar' ? 'حسابك متصل بالفعل! ✅' : 'Your account is already connected! ✅');
  return { success: true, replied: true };
}

async function handleDisconnectCommand(message: WhatsAppNormalizedMessage, connection: WhatsAppConnection, lang: 'en' | 'ar'): Promise<RoutingResult> {
  await WhatsAppLinkingService.disconnect(connection.profileId);
  await sendReply(message.senderId, lang, lang === 'ar' ? 'تم فصل حسابك. ممكن تتصل تاني من التطبيق.' : 'Account disconnected. You can reconnect from the app.');
  return { success: true, replied: true };
}

async function handleDailySummary(senderId: string, profileId: string, lang: 'en' | 'ar'): Promise<RoutingResult> {
  try {
    const { getTool } = await import('../../src/services/aiTools');
    const tool = getTool('get_daily_summary');
    if (tool) {
      const result = await tool.execute({}, profileId, lang);
      await sendReply(senderId, lang, result.message);
      return { success: true, replied: true, toolInvoked: 'get_daily_summary' };
    }
  } catch { /* fallback */ }
  await sendReply(senderId, lang, lang === 'ar' ? 'ممكن تشوف الملخص من التطبيق.' : 'Check the dashboard in the app.');
  return { success: true, replied: true };
}

async function handleWeeklyReport(senderId: string, profileId: string, lang: 'en' | 'ar'): Promise<RoutingResult> {
  try {
    const { getTool } = await import('../../src/services/aiTools');
    const tool = getTool('get_weekly_report');
    if (tool) {
      const result = await tool.execute({}, profileId, lang);
      await sendReply(senderId, lang, result.message);
      return { success: true, replied: true, toolInvoked: 'get_weekly_report' };
    }
  } catch { /* fallback */ }
  await sendReply(senderId, lang, lang === 'ar' ? 'تقرير الأسبوع متاح من التطبيق.' : 'Weekly report available in the app.');
  return { success: true, replied: true };
}

async function handleProgressQuery(senderId: string, profileId: string, lang: 'en' | 'ar'): Promise<RoutingResult> {
  try {
    const { getTool } = await import('../../src/services/aiTools');
    const tool = getTool('get_progress');
    if (tool) {
      const result = await tool.execute({}, profileId, lang);
      await sendReply(senderId, lang, result.message);
      return { success: true, replied: true, toolInvoked: 'get_progress' };
    }
  } catch { /* fallback */ }
  await sendReply(senderId, lang, lang === 'ar' ? 'ممكن تشوف تقدمك من التطبيق.' : 'Check your progress in the app.');
  return { success: true, replied: true };
}

async function handleConfirmCommand(senderId: string, lang: 'en' | 'ar'): Promise<RoutingResult> {
  await sendReply(senderId, lang, lang === 'ar' ? 'تم التأكيد! ✅' : 'Confirmed! ✅');
  return { success: true, replied: true };
}

async function handleCancelCommand(senderId: string, lang: 'en' | 'ar'): Promise<RoutingResult> {
  await sendReply(senderId, lang, lang === 'ar' ? 'تم الإلغاء.' : 'Cancelled.');
  return { success: true, replied: true };
}

async function handleUnlinkedUser(message: WhatsAppNormalizedMessage): Promise<void> {
  const lang = detectLanguage(message.text || '') || 'en';
  await sendReply(message.senderId, lang, lang === 'ar'
    ? 'مرحبًا! لازم تربط حسابك الأول.\nافتح التطبيق → الإعدادات → اربط واتساب.'
    : 'Hello! You need to link your account first.\nOpen the app → Settings → Connect WhatsApp.');
}

async function sendReply(senderId: string, _lang: 'en' | 'ar', text: string): Promise<void> {
  const provider = getWhatsAppProvider();
  await provider.sendText(senderId, text);
}

async function storeAssistantMessage(
  db: SupabaseClient, conversationId: string, content: string,
  toolName?: string, toolResult?: { success: boolean; message: string; data?: unknown; actionTaken?: string }
): Promise<void> {
  const msgId = 'msg_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
  await db.from('ai_messages').insert({
    id: msgId,
    conversation_id: conversationId,
    role: 'assistant',
    content,
    tool_name: toolName || null,
    tool_payload: toolResult ? JSON.stringify(toolResult) : null,
    created_at: new Date().toISOString(),
  });
}

function detectLanguage(text: string): 'en' | 'ar' | null {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (text.length > 0) return 'en';
  return null;
}

function hashForLog(id: string): string {
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 12);
}

async function buildToolDeclarations() {
  const { getAllTools } = await import('../../src/services/aiTools');
  return getAllTools().map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
}
