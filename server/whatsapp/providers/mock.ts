import { WhatsAppProvider } from '../../../src/types';

interface MockMessage {
  to: string;
  type: string;
  content: string;
  timestamp: string;
}

const sentMessages: MockMessage[] = [];
let webhookVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'test_verify_token';

export class MockProvider implements WhatsAppProvider {
  async sendText(to: string, text: string): Promise<{ messageId: string; success: boolean }> {
    const messageId = 'mock_msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    sentMessages.push({ to, type: 'text', content: text, timestamp: new Date().toISOString() });
    return { messageId, success: true };
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<{ messageId: string; success: boolean }> {
    const messageId = 'mock_msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    sentMessages.push({ to, type: 'image', content: caption || imageUrl, timestamp: new Date().toISOString() });
    return { messageId, success: true };
  }

  async sendInteractive(to: string, body: string, buttons: Array<{ id: string; title: string }>): Promise<{ messageId: string; success: boolean }> {
    const messageId = 'mock_msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    sentMessages.push({ to, type: 'interactive', content: body + ' [' + buttons.map(b => b.title).join(', ') + ']', timestamp: new Date().toISOString() });
    return { messageId, success: true };
  }

  async markAsRead(_messageId: string): Promise<boolean> {
    return true;
  }

  verifyWebhook(mode: string, token: string, challenge?: string): string | null {
    if (mode === 'subscribe' && token === webhookVerifyToken) {
      return challenge || 'OK';
    }
    return null;
  }

  async downloadMedia(_mediaId: string): Promise<{ mimeType: string; data: Buffer }> {
    return { mimeType: 'image/jpeg', data: Buffer.from('mock_image_data') };
  }

  // ── Test helpers ──
  static getSentMessages(): MockMessage[] {
    return [...sentMessages];
  }

  static clearSentMessages(): void {
    sentMessages.length = 0;
  }

  static setWebhookVerifyToken(token: string): void {
    webhookVerifyToken = token;
  }

  static getLastMessage(): MockMessage | undefined {
    return sentMessages[sentMessages.length - 1];
  }
}
