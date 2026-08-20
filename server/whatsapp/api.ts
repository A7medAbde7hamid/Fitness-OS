import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { WhatsAppLinkingService } from './linking';

export async function getWhatsAppStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const profileId = req.userId!;
    const connection = await WhatsAppLinkingService.getConnectionByProfileId(profileId);

    if (!connection) {
      res.json({ connected: false });
      return;
    }

    res.json({
      connected: connection.status === 'verified',
      status: connection.status,
      externalUserId: connection.externalUserId ? '***' + connection.externalUserId.slice(-4) : null,
      language: connection.language,
      lastMessageAt: connection.lastMessageAt,
      createdAt: connection.createdAt,
    });
  } catch {
    res.json({ connected: false });
  }
}

export async function connectWhatsApp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const profileId = req.userId!;
    const { externalUserId, phoneReference } = req.body;

    if (!externalUserId || typeof externalUserId !== 'string') {
      res.status(400).json({ error: 'externalUserId is required' });
      return;
    }

    const connection = await WhatsAppLinkingService.createConnection(
      profileId,
      externalUserId.trim(),
      phoneReference
    );

    res.json({ connected: true, connectionId: connection.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    res.status(400).json({ error: message });
  }
}

export async function disconnectWhatsApp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const profileId = req.userId!;
    const success = await WhatsAppLinkingService.disconnect(profileId);
    res.json({ disconnected: success });
  } catch {
    res.status(500).json({ error: 'Disconnect failed' });
  }
}

export async function generateLinkToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const profileId = req.userId!;
    const token = await WhatsAppLinkingService.generateLinkingToken(profileId);
    res.json({ token, expiresIn: 900 });
  } catch {
    res.status(500).json({ error: 'Token generation failed' });
  }
}
