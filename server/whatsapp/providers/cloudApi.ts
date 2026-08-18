import { WhatsAppProvider } from '../../../src/types';

interface CloudAPIConfig {
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  apiVersion: string;
}

export class CloudAPIProvider implements WhatsAppProvider {
  private config: CloudAPIConfig;
  private baseUrl: string;

  constructor(config: CloudAPIConfig) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}`;
  }

  async sendText(to: string, text: string): Promise<{ messageId: string; success: boolean }> {
    const res = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('WhatsApp sendText failed:', err);
      return { messageId: '', success: false };
    }

    const data = await res.json();
    const messageId = data.messages?.[0]?.id || '';
    return { messageId, success: Boolean(messageId) };
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<{ messageId: string; success: boolean }> {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl },
    };
    if (caption) (body.image as Record<string, unknown>).caption = caption;

    const res = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return { messageId: '', success: false };
    const data = await res.json();
    return { messageId: data.messages?.[0]?.id || '', success: true };
  }

  async sendInteractive(to: string, body: string, buttons: Array<{ id: string; title: string }>): Promise<{ messageId: string; success: boolean }> {
    const res = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: body },
          action: { buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
        },
      }),
    });

    if (!res.ok) return { messageId: '', success: false };
    const data = await res.json();
    return { messageId: data.messages?.[0]?.id || '', success: true };
  }

  async markAsRead(messageId: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
    return res.ok;
  }

  verifyWebhook(mode: string, token: string, challenge?: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge || 'OK';
    }
    return null;
  }

  async downloadMedia(mediaId: string): Promise<{ mimeType: string; data: Buffer }> {
    const res = await fetch(`${this.baseUrl}/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${this.config.accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to download media');
    const meta = await res.json();
    const fileRes = await fetch(meta.url, {
      headers: { 'Authorization': `Bearer ${this.config.accessToken}` },
    });
    if (!fileRes.ok) throw new Error('Failed to download media file');
    const arrayBuffer = await fileRes.arrayBuffer();
    return { mimeType: meta.mime_type, data: Buffer.from(arrayBuffer) };
  }
}
