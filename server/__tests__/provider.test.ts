import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getWhatsAppProvider, resetWhatsAppProvider } from '../whatsapp/provider';
import { MockProvider } from '../whatsapp/providers/mock';

describe('WhatsApp Provider Factory', () => {
  afterEach(() => {
    resetWhatsAppProvider();
  });

  it('should return MockProvider by default', () => {
    const provider = getWhatsAppProvider();
    expect(provider).toBeInstanceOf(MockProvider);
  });

  it('should return same instance on multiple calls', () => {
    const p1 = getWhatsAppProvider();
    const p2 = getWhatsAppProvider();
    expect(p1).toBe(p2);
  });

  it('should reset to new instance', () => {
    const p1 = getWhatsAppProvider();
    resetWhatsAppProvider();
    const p2 = getWhatsAppProvider();
    expect(p1).not.toBe(p2);
  });
});

describe('MockProvider', () => {
  let mock: MockProvider;

  beforeEach(() => {
    MockProvider.clearSentMessages();
    mock = new MockProvider();
  });

  it('should send text message and store in sent messages', async () => {
    const result = await mock.sendText('123', 'Hello');
    expect(result).toEqual({ messageId: expect.stringContaining('mock_msg_'), success: true });
    const messages = MockProvider.getSentMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({
      to: '123',
      type: 'text',
      content: 'Hello',
      timestamp: expect.any(String),
    });
  });

  it('should send image message', async () => {
    const result = await mock.sendImage('123', 'base64data', 'image/jpeg');
    expect(result.success).toBe(true);
    expect(MockProvider.getSentMessages()).toHaveLength(1);
    expect(MockProvider.getSentMessages()[0].type).toBe('image');
  });

  it('should mark message as read', async () => {
    const result = await mock.markAsRead('msg_1');
    expect(result).toBe(true);
  });

  it('should return challenge for valid webhook verification', () => {
    const result = mock.verifyWebhook('subscribe', 'test_verify_token', 'challenge_123');
    expect(result).toBe('challenge_123');
  });

  it('should return null for invalid webhook verification', () => {
    const result = mock.verifyWebhook('subscribe', 'wrong_token', 'challenge_123');
    expect(result).toBeNull();
  });

  it('should download mock media', async () => {
    const result = await mock.downloadMedia('media_1');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.data).toBeInstanceOf(Buffer);
    expect(result.data.toString()).toBe('mock_image_data');
  });

  it('should clear sent messages via static method', async () => {
    await mock.sendText('123', 'msg1');
    await mock.sendText('123', 'msg2');
    MockProvider.clearSentMessages();
    expect(MockProvider.getSentMessages()).toHaveLength(0);
  });

  it('should set and get webhook verify token via static method', () => {
    MockProvider.setWebhookVerifyToken('my_token');
    const result = mock.verifyWebhook('subscribe', 'my_token', 'challenge');
    expect(result).toBe('challenge');
  });

  it('should track last sent message via static method', async () => {
    await mock.sendText('123', 'first');
    expect(MockProvider.getLastMessage()).toMatchObject({ to: '123', content: 'first' });

    await mock.sendText('123', 'second');
    expect(MockProvider.getLastMessage()).toMatchObject({ to: '123', content: 'second' });
  });

  it('should send interactive message', async () => {
    const result = await mock.sendInteractive('123', 'body text', [
      { id: 'yes', title: 'Yes' },
      { id: 'no', title: 'No' },
    ]);
    expect(result.success).toBe(true);
    expect(MockProvider.getSentMessages()).toHaveLength(1);
    expect(MockProvider.getSentMessages()[0].type).toBe('interactive');
  });
});
