import { Request, Response } from 'express';
import { WhatsAppWebhookPayload } from '../../src/types';
import { getWhatsAppProvider } from './provider';
import { normalizeWebhookPayload } from './normalizer';
import { routeMessage } from './router';

export async function handleWebhookGet(req: Request, res: Response): Promise<void> {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (!mode || !token) {
    res.status(400).json({ error: 'Missing verification parameters' });
    return;
  }

  const provider = getWhatsAppProvider();
  const result = provider.verifyWebhook(mode, token, challenge);

  if (result) {
    console.log(JSON.stringify({ level: 'INFO', module: 'whatsapp_webhook', event: 'verified', mode }));
    res.status(200).send(result);
  } else {
    console.warn(JSON.stringify({ level: 'WARN', module: 'whatsapp_webhook', event: 'verification_failed' }));
    res.status(403).json({ error: 'Verification failed' });
  }
}

export async function handleWebhookPost(req: Request, res: Response): Promise<void> {
  const requestId = 'wh_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

  try {
    const payload = req.body as WhatsAppWebhookPayload;

    if (!payload || payload.object !== 'whatsapp_business_account') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    // Acknowledge immediately (WhatsApp requires fast response)
    res.status(200).json({ status: 'ok' });

    // Process messages asynchronously
    const messages = normalizeWebhookPayload(payload);

    for (const message of messages) {
      // Skip status updates
      if (!message.senderId || !message.messageId) continue;

      // Mark as read
      const provider = getWhatsAppProvider();
      provider.markAsRead(message.messageId).catch(() => {});

      // Route message
      routeMessage(message).catch(err => {
        console.error(JSON.stringify({
          level: 'ERROR',
          module: 'whatsapp_webhook',
          requestId,
          messageId: message.messageId,
          error: err instanceof Error ? err.message : 'Unknown',
        }));
      });
    }
  } catch (err) {
    console.error(JSON.stringify({
      level: 'ERROR',
      module: 'whatsapp_webhook',
      requestId,
      error: err instanceof Error ? err.message : 'Unknown',
    }));
    // Don't return error to WhatsApp - we already acknowledged
  }
}
