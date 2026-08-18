import { WhatsAppNormalizedMessage, WhatsAppWebhookPayload, WhatsAppMessageType } from '../../src/types';

export function normalizeWebhookPayload(payload: WhatsAppWebhookPayload): WhatsAppNormalizedMessage[] {
  const messages: WhatsAppNormalizedMessage[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;
      const value = change.value;

      for (const msg of value.messages || []) {
        const type = classifyMessageType(msg.type);
        const normalized: WhatsAppNormalizedMessage = {
          provider: 'cloud_api',
          senderId: msg.from,
          messageId: msg.id,
          timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
          type,
          metadata: {
            phoneNumberId: value.metadata?.phone_number_id,
            displayPhoneNumber: value.metadata?.display_phone_number,
            contactName: value.contacts?.[0]?.profile?.name,
          },
        };

        switch (type) {
          case 'text':
            normalized.text = msg.text?.body;
            break;
          case 'image':
            normalized.media = {
              mimeType: msg.image?.mime_type || 'image/jpeg',
              url: msg.image?.id || '',
              caption: msg.image?.caption,
            };
            break;
          case 'audio':
            normalized.media = { mimeType: msg.audio?.mime_type || 'audio/ogg', url: msg.audio?.id || '' };
            break;
          case 'document':
            normalized.media = {
              mimeType: msg.document?.mime_type || 'application/pdf',
              url: msg.document?.id || '',
              caption: msg.document?.caption,
            };
            break;
          case 'location':
            normalized.metadata.latitude = msg.location?.latitude;
            normalized.metadata.longitude = msg.location?.longitude;
            normalized.metadata.locationName = msg.location?.name;
            break;
        }

        messages.push(normalized);
      }
    }
  }

  return messages;
}

function classifyMessageType(type: string): WhatsAppMessageType {
  const valid: WhatsAppMessageType[] = ['text', 'image', 'audio', 'document', 'location'];
  return valid.includes(type as WhatsAppMessageType) ? (type as WhatsAppMessageType) : 'text';
}

export function extractTextIntent(text: string): { command: string; args: string } {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (/^(connect|link|ربط| tying)/i.test(lower)) return { command: 'connect', args: '' };
  if (/^(disconnect|unlink|فصل| قطع)/i.test(lower)) return { command: 'disconnect', args: '' };
  if (/^(confirm|okay|ok|done|موافق|تأكيد|تمام)/i.test(lower)) return { command: 'confirm', args: '' };
  if (/^(cancel|no|إلغاء|لأ)/i.test(lower)) return { command: 'cancel', args: '' };
  if (/^(edit|تعديل|عدل)/i.test(lower)) return { command: 'edit', args: '' };
  if (/^(summary|daily|ملخص| اليوم|عملت إيه)/i.test(lower)) return { command: 'daily_summary', args: '' };
  if (/^(weekly|report|تقرير|الأسبوع)/i.test(lower)) return { command: 'weekly_report', args: '' };
  if (/^(progress|تقدم|فين| وصلت|فاضلي)/i.test(lower)) return { command: 'progress', args: '' };

  return { command: 'message', args: trimmed };
}
