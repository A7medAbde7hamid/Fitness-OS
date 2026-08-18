import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { AppStorageRepository } from '../../db/storage';
import {
  AIConversation,
  AIConversationMessage,
  AICoachRole,
} from '../../types';
import { AICoachService, AICoachMessage, AICoachToolResult } from '../../services/aiCoachService';
import { MealConfirmationService } from '../../services/mealConfirmationService';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ChatMessage, ConfirmationCard, ToolActionCard } from './ChatMessage';
import { ConversationList, ChatInput } from './ConversationList';

interface ChatMessageInternal {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolResults?: AICoachToolResult[];
  pendingConfirmation?: AICoachToolResult;
}

export const CoachView: React.FC = () => {
  const { profile, user } = useAuth();
  const { language } = useI18n();
  const { trigger } = useHapticFeedback();
  const isAr = language === 'ar';

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessageInternal[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (!user) return;
    const saved = AppStorageRepository.getConversations(user.id);
    setConversations(saved);
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize welcome message when a new conversation starts
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = isAr
        ? `مرحباً! أنا مدربك الذكي. لدي بياناتك الملفية (${profile?.dailyCalorieTarget || 2150} سعرة، ${profile?.dailyProteinTargetGrams || 160} جم بروتين). كيف يمكنني مساعدتك؟`
        : `Hello! I am your AI fitness coach. I have your profile loaded (${profile?.dailyCalorieTarget || 2150} kcal, ${profile?.dailyProteinTargetGrams || 160}g protein). How can I help you today?`;

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMsg,
        },
      ]);
    }
  }, [messages.length, isAr, profile]);

  const createNewConversation = useCallback(() => {
    if (!user) return;

    const firstUserMsg = inputPrompt || (isAr ? 'مرحباً' : 'Hi');
    const title = AICoachService.generateConversationTitle(firstUserMsg, language);

    const conv: AIConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      userId: user.id,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };

    AppStorageRepository.saveConversation(user.id, conv);
    setConversations([conv, ...conversations]);
    setActiveConvId(conv.id);
    setMessages([]);
  }, [user, inputPrompt, language, isAr, conversations]);

  const handleSend = useCallback(async () => {
    if (!inputPrompt.trim() || isLoading || !user) return;

    const textToSend = inputPrompt;
    const convId = activeConvId;

    // If no active conversation, create one
    if (!convId) {
      const title = AICoachService.generateConversationTitle(textToSend, language);
      const conv: AIConversation = {
        id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        userId: user.id,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };
      AppStorageRepository.saveConversation(user.id, conv);
      setActiveConvId(conv.id);
      setConversations([conv, ...conversations]);
    }

    // Add user message
    const userMsg: ChatMessageInternal = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);
    trigger('light');

    // Persist user message to conversation
    if (convId || activeConvId) {
      const msg: AIConversationMessage = {
        id: userMsg.id,
        conversationId: convId || activeConvId || '',
        role: 'user',
        content: textToSend,
        createdAt: new Date().toISOString(),
      };
      AppStorageRepository.addConversationMessage(msg.conversationId, msg);
    }

    try {
      // Build messages for the API
      const apiMessages: AICoachMessage[] = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
      apiMessages.push({ role: 'user', content: textToSend });

      const result = await AICoachService.sendMessage(
        user.id,
        apiMessages,
        language,
        convId || activeConvId
      );

      trigger('medium');

      // Check for tool results requiring confirmation
      const toolResultsNeedingConfirmation = result.toolResults.filter((tr) => tr.requiresConfirmation);

      if (toolResultsNeedingConfirmation.length > 0 && result.requiresConfirmation) {
        // Add assistant message with pending confirmation
        const pendingResult = toolResultsNeedingConfirmation[0];
        const assistantMsg: ChatMessageInternal = {
          id: 'msg_' + Date.now() + '_ai',
          role: 'assistant',
          content: result.message,
          pendingConfirmation: pendingResult,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Persist
        if (pendingResult.toolName === 'log_meal_described' && pendingResult.data) {
          const data = pendingResult.data as any;
          const pendingMeal = data.pendingMealId;
          if (pendingMeal) {
            const mealConfirmation = MealConfirmationService.getPendingMeal(user.id, pendingMeal);
            if (mealConfirmation) {
              assistantMsg.pendingConfirmation = {
                ...pendingResult,
                data: {
                  ...data,
                  pendingMeal,
                  mealType: data.mealType,
                  items: mealConfirmation.items,
                  totalCalories: mealConfirmation.totalCalories,
                  totalProtein: mealConfirmation.totalProtein,
                  totalCarbs: mealConfirmation.totalCarbs,
                  totalFat: mealConfirmation.totalFat,
                  confidence: mealConfirmation.confidence,
                  confidenceLevel: mealConfirmation.confidenceLevel,
                },
              };
            }
          }
        }
      } else if (result.toolResults.length > 0) {
        // Add assistant message with tool results
        const assistantMsg: ChatMessageInternal = {
          id: 'msg_' + Date.now() + '_ai',
          role: 'assistant',
          content: result.message,
          toolResults: result.toolResults,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        trigger('success');
      } else {
        // Simple assistant response
        const assistantMsg: ChatMessageInternal = {
          id: 'msg_' + Date.now() + '_ai',
          role: 'assistant',
          content: result.message,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Coach send error:', err);
      trigger('error');
      const errorMsg: ChatMessageInternal = {
        id: 'msg_' + Date.now() + '_error',
        role: 'assistant',
        content: isAr
          ? 'حدث خطأ غير متوقع أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.'
          : 'An unexpected error occurred while processing your request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputPrompt, isLoading, user, language, isAr, messages, activeConvId, conversations, trigger]);

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setInputPrompt(prompt);
  }, []);

  const handleConfirmToolAction = useCallback(async (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg?.pendingConfirmation || !user) return;

    const pending = msg.pendingConfirmation;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, pendingConfirmation: undefined, content: m.content }
          : m
      )
    );

    if (pending.actionTaken === 'log_meal_described' && pending.data) {
      const data = pending.data as any;
      if (data.pendingMeal) {
        const result = MealConfirmationService.confirmMeal(user.id, data.pendingMeal);
        if (result.success) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: m.content + ' ' + (isAr ? 'تم حفظ الوجبة بنجاح!' : 'Meal saved successfully!'),
                  }
                : m
            )
          );
          trigger('success');
        }
      }
    }

    trigger('mealLogged');
  }, [messages, user, isAr, trigger]);

  const handleCancelToolAction = useCallback((msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, pendingConfirmation: undefined } : m
      )
    );
  }, []);

  const handleSelectConversation = useCallback((convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;

    setActiveConvId(convId);

    const savedMessages = AppStorageRepository.getConversationMessages(convId);
    const chatMessages: ChatMessageInternal[] = savedMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    setMessages(chatMessages.length > 0 ? chatMessages : []);
  }, [conversations]);

  const handleDeleteConversation = useCallback((convId: string) => {
    if (!user) return;
    AppStorageRepository.deleteConversation(user.id, convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
  }, [user, activeConvId]);

  const handleNewConversation = useCallback(() => {
    if (!user) return;
    const conv: AIConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      userId: user.id,
      title: isAr ? 'دردشة جديدة' : 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };
    AppStorageRepository.saveConversation(user.id, conv);
    setConversations([conv, ...conversations]);
    setActiveConvId(conv.id);
    setMessages([]);
  }, [user, conversations, isAr]);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div id="coach-view" className="space-y-4 max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] md:max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4E00] to-[#FF7A00] flex items-center justify-center text-white font-black shadow-lg shadow-[#FF4E00]/25">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>AI Coach</span>
              <Badge variant="emerald" size="sm">
                Gemini 3.7 Flash
              </Badge>
            </h2>
            <p className="text-xs text-neutral-400">
              {isAr
                ? 'مدربك الشخصي بالذكاء الاصطناعي'
                : 'Your personal AI fitness coach'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSidebar(true)}
          className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white transition-colors"
          aria-label={isAr ? 'المحادثات' : 'Conversations'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex gap-4">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64">
          <GlassCard variant="card" className="h-full flex flex-col">
            <ConversationList
              conversations={conversations}
              activeConvId={activeConvId}
              onSelect={handleSelectConversation}
              onNew={handleNewConversation}
              onDelete={handleDeleteConversation}
              language={language}
            />
          </GlassCard>
        </div>

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setShowSidebar(false)}
          >
            <div
              className="absolute inset-y-0 left-0 w-64 bg-neutral-900 border-r border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  activeConvId={activeConvId}
                  onSelect={(id) => {
                    handleSelectConversation(id);
                    setShowSidebar(false);
                  }}
                  onNew={() => {
                    handleNewConversation();
                    setShowSidebar(false);
                  }}
                  onDelete={handleDeleteConversation}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <GlassCard variant="card" className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id}>
                <ChatMessage
                  role={m.role}
                  content={m.content}
                  toolResults={m.toolResults}
                />

                {m.pendingConfirmation && (
                  <div className="mt-3">
                    <ConfirmationCard
                      result={m.pendingConfirmation}
                      onConfirm={() => handleConfirmToolAction(m.id)}
                      onEdit={() => {}}
                      onCancel={() => handleCancelToolAction(m.id)}
                      isProcessing={false}
                    />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-[#FF4E00]/15 border border-[#FF4E00]/25 text-[#FF6B2B] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl max-w-[70%] glass-panel-card text-neutral-200 border border-white/10 space-y-2">
                  <LoadingSkeleton variant="text" className="w-32 h-3" />
                  <LoadingSkeleton variant="text" className="w-48 h-3" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </GlassCard>

          <ChatInput
            value={inputPrompt}
            onChange={setInputPrompt}
            onSend={handleSend}
            isLoading={isLoading}
            language={language}
            onSuggestedPrompt={handleSuggestedPrompt}
          />
        </div>
      </div>
    </div>
  );
};
