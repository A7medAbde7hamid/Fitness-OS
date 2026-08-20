import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WhatsAppConnection, WhatsAppLinkingToken } from '../../src/types';
import crypto from 'crypto';

let supabaseAdmin: SupabaseClient | null = null;

function getDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return supabaseAdmin;
}

const LINKING_TOKENS_TABLE = 'whatsapp_linking_tokens';

export class WhatsAppLinkingService {
  static async getConnectionByExternalId(externalUserId: string): Promise<WhatsAppConnection | null> {
    const db = getDb();
    const { data, error } = await db
      .from('whatsapp_connections')
      .select('*')
      .eq('external_user_id', externalUserId)
      .eq('status', 'verified')
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  static async getConnectionByProfileId(profileId: string): Promise<WhatsAppConnection | null> {
    const db = getDb();
    const { data, error } = await db
      .from('whatsapp_connections')
      .select('*')
      .eq('profile_id', profileId)
      .in('status', ['pending', 'verified'])
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  static async createConnection(profileId: string, externalUserId: string, phoneReference?: string): Promise<WhatsAppConnection> {
    const db = getDb();
    const now = new Date().toISOString();
    const id = 'wa_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');

    const existing = await this.getConnectionByExternalId(externalUserId);
    if (existing) {
      if (existing.profileId === profileId) return existing;
      throw new Error('This WhatsApp account is already linked to another profile.');
    }

    const existingProfile = await this.getConnectionByProfileId(profileId);
    if (existingProfile && existingProfile.status === 'verified') {
      throw new Error('This profile already has a linked WhatsApp account.');
    }

    const row = {
      id,
      profile_id: profileId,
      provider: 'cloud_api',
      external_user_id: externalUserId,
      phone_reference: phoneReference || null,
      status: 'verified',
      language: 'en',
      verified_at: now,
      last_message_at: null,
      created_at: now,
      updated_at: now,
    };

    const { error } = await db.from('whatsapp_connections').upsert(row, { onConflict: 'external_user_id' });
    if (error) throw error;

    return this.mapRow(row);
  }

  static async disconnect(profileId: string): Promise<boolean> {
    const db = getDb();
    const { error } = await db
      .from('whatsapp_connections')
      .update({ status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('profile_id', profileId)
      .eq('status', 'verified');
    return !error;
  }

  static async updateLastMessage(externalUserId: string): Promise<void> {
    const db = getDb();
    await db
      .from('whatsapp_connections')
      .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('external_user_id', externalUserId);
  }

  static async updateLanguage(externalUserId: string, language: 'en' | 'ar'): Promise<void> {
    const db = getDb();
    await db
      .from('whatsapp_connections')
      .update({ language, updated_at: new Date().toISOString() })
      .eq('external_user_id', externalUserId);
  }

  static async generateLinkingToken(profileId: string): Promise<string> {
    const db = getDb();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.from(LINKING_TOKENS_TABLE).insert({
      token,
      profile_id: profileId,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString(),
    });

    return token;
  }

  static async verifyLinkingToken(token: string): Promise<WhatsAppLinkingToken | null> {
    const db = getDb();
    const { data, error } = await db
      .from(LINKING_TOKENS_TABLE)
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (error || !data) return null;

    if (new Date(data.expires_at) < new Date()) {
      await db.from(LINKING_TOKENS_TABLE).update({ used: true }).eq('token', token);
      return null;
    }

    await db.from(LINKING_TOKENS_TABLE).update({ used: true }).eq('token', token);

    return {
      token: data.token,
      profileId: data.profile_id,
      expiresAt: data.expires_at,
      used: true,
    };
  }

  static hashPhone(phone: string): string {
    return crypto.createHash('sha256').update(phone).digest('hex').slice(0, 16);
  }

  private static mapRow(row: Record<string, unknown>): WhatsAppConnection {
    return {
      id: row.id as string,
      profileId: row.profile_id as string,
      provider: row.provider as 'cloud_api' | 'mock',
      externalUserId: row.external_user_id as string,
      phoneReference: row.phone_reference as string | undefined,
      status: row.status as 'pending' | 'verified' | 'disconnected',
      language: (row.language as 'en' | 'ar') || 'en',
      verifiedAt: row.verified_at as string | undefined,
      lastMessageAt: row.last_message_at as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
