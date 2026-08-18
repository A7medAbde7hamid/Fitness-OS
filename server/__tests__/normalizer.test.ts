import { describe, it, expect } from 'vitest';
import { normalizeWebhookPayload, extractTextIntent } from '../whatsapp/normalizer';
import { WhatsAppWebhookPayload } from '../../src/types';

describe('WhatsApp Normalizer', () => {
  describe('normalizeWebhookPayload', () => {
    it('should extract text message from webhook payload', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_1',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1234567890', phone_number_id: 'pn_1' },
              contacts: [{ profile: { name: 'Test User' }, wa_id: '1234567890' }],
              messages: [{
                from: '1234567890',
                id: 'msg_1',
                timestamp: '1700000000',
                type: 'text',
                text: { body: 'Hello world' },
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        provider: 'cloud_api',
        senderId: '1234567890',
        messageId: 'msg_1',
        type: 'text',
        text: 'Hello world',
      });
      expect(result[0].metadata?.contactName).toBe('Test User');
      expect(result[0].metadata?.phoneNumberId).toBe('pn_1');
    });

    it('should convert timestamp to ISO string', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              messages: [{
                from: '1', id: 'm1', timestamp: '1700000000', type: 'text', text: { body: 'Hi' },
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result[0].timestamp).toBe(new Date(1700000000 * 1000).toISOString());
    });

    it('should extract image message with caption', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              contacts: [{ profile: { name: 'User' }, wa_id: '111' }],
              messages: [{
                from: '111', id: 'm2', timestamp: '1700000000', type: 'image',
                image: { id: 'media_1', mime_type: 'image/jpeg', caption: 'My lunch' },
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('image');
      expect(result[0].text).toBeUndefined();
      expect(result[0].media).toEqual({
        mimeType: 'image/jpeg',
        url: 'media_1',
        caption: 'My lunch',
      });
    });

    it('should skip status updates (no messages array)', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              statuses: [{
                id: 'msg_1', status: 'delivered', timestamp: '1700000000', recipient_id: '123',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(0);
    });

    it('should skip changes with field !== messages', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              messages: [{
                from: '1', id: 'm1', timestamp: '1700000000', type: 'text', text: { body: 'Hi' },
              }],
            },
            field: 'accounts',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple messages', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              contacts: [{ profile: { name: 'U' }, wa_id: '1' }],
              messages: [
                { from: '1', id: 'm1', timestamp: '1700000000', type: 'text', text: { body: 'First' } },
                { from: '1', id: 'm2', timestamp: '1700000001', type: 'text', text: { body: 'Second' } },
              ],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('First');
      expect(result[1].text).toBe('Second');
    });

    it('should handle missing contacts gracefully', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              messages: [{
                from: '123', id: 'm1', timestamp: '1700000000', type: 'text', text: { body: 'Hi' },
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(1);
      expect(result[0].metadata?.contactName).toBeUndefined();
    });

    it('should return empty array for non-whatsapp payload', () => {
      const payload = { object: 'page' } as unknown as WhatsAppWebhookPayload;
      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(0);
    });

    it('should handle empty entries', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [],
      };
      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(0);
    });

    it('should handle audio message', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              messages: [{
                from: '1', id: 'm1', timestamp: '1700000000', type: 'audio',
                audio: { id: 'aud_1', mime_type: 'audio/ogg' },
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('audio');
      expect(result[0].media).toEqual({ mimeType: 'audio/ogg', url: 'aud_1' });
    });

    it('should handle location message', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              messages: [{
                from: '1', id: 'm1', timestamp: '1700000000', type: 'location',
                location: { latitude: 40.7128, longitude: -74.0060, name: 'New York' },
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('location');
      expect(result[0].metadata?.latitude).toBe(40.7128);
      expect(result[0].metadata?.longitude).toBe(-74.006);
      expect(result[0].metadata?.locationName).toBe('New York');
    });

    it('should default unknown types to text', () => {
      const payload: WhatsAppWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'e',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+1', phone_number_id: 'pn' },
              messages: [{
                from: '1', id: 'm1', timestamp: '1700000000', type: 'sticker' as never,
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const result = normalizeWebhookPayload(payload);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('text');
    });
  });

  describe('extractTextIntent', () => {
    it('should detect connect intent', () => {
      expect(extractTextIntent('connect')).toEqual({ command: 'connect', args: '' });
      expect(extractTextIntent('Connect')).toEqual({ command: 'connect', args: '' });
      expect(extractTextIntent('  CONNECT  ')).toEqual({ command: 'connect', args: '' });
      expect(extractTextIntent('link')).toEqual({ command: 'connect', args: '' });
      expect(extractTextIntent('ربط')).toEqual({ command: 'connect', args: '' });
    });

    it('should detect disconnect intent', () => {
      expect(extractTextIntent('disconnect')).toEqual({ command: 'disconnect', args: '' });
      expect(extractTextIntent('DISCONNECT')).toEqual({ command: 'disconnect', args: '' });
      expect(extractTextIntent('unlink')).toEqual({ command: 'disconnect', args: '' });
      expect(extractTextIntent('فصل')).toEqual({ command: 'disconnect', args: '' });
    });

    it('should detect confirm intent', () => {
      expect(extractTextIntent('1')).toEqual({ command: 'message', args: '1' });
      expect(extractTextIntent('confirm')).toEqual({ command: 'confirm', args: '' });
      expect(extractTextIntent('yes')).toEqual({ command: 'message', args: 'yes' });
      expect(extractTextIntent('ok')).toEqual({ command: 'confirm', args: '' });
      expect(extractTextIntent('done')).toEqual({ command: 'confirm', args: '' });
      expect(extractTextIntent('تمام')).toEqual({ command: 'confirm', args: '' });
    });

    it('should detect cancel intent', () => {
      expect(extractTextIntent('cancel')).toEqual({ command: 'cancel', args: '' });
      expect(extractTextIntent('no')).toEqual({ command: 'cancel', args: '' });
      expect(extractTextIntent('إلغاء')).toEqual({ command: 'cancel', args: '' });
    });

    it('should detect daily summary intent', () => {
      expect(extractTextIntent('summary')).toEqual({ command: 'daily_summary', args: '' });
      expect(extractTextIntent('daily')).toEqual({ command: 'daily_summary', args: '' });
      expect(extractTextIntent('today')).toEqual({ command: 'message', args: 'today' });
      expect(extractTextIntent('ملخص')).toEqual({ command: 'daily_summary', args: '' });
    });

    it('should detect weekly report intent', () => {
      expect(extractTextIntent('weekly')).toEqual({ command: 'weekly_report', args: '' });
      expect(extractTextIntent('report')).toEqual({ command: 'weekly_report', args: '' });
      expect(extractTextIntent('تقرير')).toEqual({ command: 'weekly_report', args: '' });
    });

    it('should detect progress intent', () => {
      expect(extractTextIntent('progress')).toEqual({ command: 'progress', args: '' });
      expect(extractTextIntent('تقدم')).toEqual({ command: 'progress', args: '' });
    });

    it('should detect edit intent', () => {
      expect(extractTextIntent('edit')).toEqual({ command: 'edit', args: '' });
      expect(extractTextIntent('تعديل')).toEqual({ command: 'edit', args: '' });
    });

    it('should default to message for other inputs', () => {
      expect(extractTextIntent('I ate chicken and rice')).toEqual({ command: 'message', args: 'I ate chicken and rice' });
      expect(extractTextIntent('مرحبا')).toEqual({ command: 'message', args: 'مرحبا' });
      expect(extractTextIntent('  Hello world  ')).toEqual({ command: 'message', args: 'Hello world' });
    });
  });
});
