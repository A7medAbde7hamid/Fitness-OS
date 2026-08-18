-- WhatsApp Integration Tables
-- Phase 7: WhatsApp AI Coach

-- WhatsApp Connections
-- Links WhatsApp phone numbers to user profiles
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'cloud_api',
  external_user_id TEXT UNIQUE NOT NULL,
  phone_reference TEXT,
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'disconnected')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  verified_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookup by external user ID
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_external_user_id
  ON whatsapp_connections(external_user_id);

-- Index for lookup by profile ID
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_profile_id
  ON whatsapp_connections(profile_id);

-- WhatsApp Message Log
-- Deduplication and tracking of processed messages
CREATE TABLE IF NOT EXISTS whatsapp_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_message_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed',
  error_message TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_external_message_id
  ON whatsapp_message_log(external_message_id);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_processed_at
  ON whatsapp_message_log(processed_at);

-- Pending WhatsApp Meals
-- Stores food analysis results awaiting user confirmation
CREATE TABLE IF NOT EXISTS pending_whatsapp_meals (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  confidence NUMERIC,
  source TEXT DEFAULT 'whatsapp_image',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup of old pending meals
CREATE INDEX IF NOT EXISTS idx_pending_whatsapp_meals_created_at
  ON pending_whatsapp_meals(created_at);

-- Index for lookup by profile
CREATE INDEX IF NOT EXISTS idx_pending_whatsapp_meals_profile_id
  ON pending_whatsapp_meals(profile_id);

-- RLS Policies

-- WhatsApp Connections: users can only see their own connections
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own WhatsApp connections"
  ON whatsapp_connections FOR SELECT
  USING (auth.uid()::text = profile_id);

CREATE POLICY "Users can insert own WhatsApp connections"
  ON whatsapp_connections FOR INSERT
  WITH CHECK (auth.uid()::text = profile_id);

CREATE POLICY "Users can update own WhatsApp connections"
  ON whatsapp_connections FOR UPDATE
  USING (auth.uid()::text = profile_id);

-- WhatsApp Message Log: service role only (no direct user access)
ALTER TABLE whatsapp_message_log ENABLE ROW LEVEL SECURITY;

-- Pending WhatsApp Meals: users can only see their own
ALTER TABLE pending_whatsapp_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending meals"
  ON pending_whatsapp_meals FOR SELECT
  USING (auth.uid()::text = profile_id);

CREATE POLICY "Users can insert own pending meals"
  ON pending_whatsapp_meals FOR INSERT
  WITH CHECK (auth.uid()::text = profile_id);

CREATE POLICY "Users can delete own pending meals"
  ON pending_whatsapp_meals FOR DELETE
  USING (auth.uid() = profile_id);
