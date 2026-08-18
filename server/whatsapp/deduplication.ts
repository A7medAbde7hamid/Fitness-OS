import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export class WhatsAppDeduplication {
  static async isProcessed(messageId: string): Promise<boolean> {
    const db = getDb();
    const { data } = await db
      .from('whatsapp_message_log')
      .select('id')
      .eq('external_message_id', messageId)
      .single();
    return Boolean(data);
  }

  static async markProcessed(messageId: string, senderId: string, status: string = 'processed'): Promise<void> {
    const db = getDb();
    await db.from('whatsapp_message_log').insert({
      external_message_id: messageId,
      sender_id: senderId,
      status,
      processed_at: new Date().toISOString(),
    });
  }

  static async markFailed(messageId: string, senderId: string, error: string): Promise<void> {
    const db = getDb();
    await db.from('whatsapp_message_log').insert({
      external_message_id: messageId,
      sender_id: senderId,
      status: 'failed',
      error_message: error,
      processed_at: new Date().toISOString(),
    });
  }
}
