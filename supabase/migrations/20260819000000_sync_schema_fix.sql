-- ==========================================================
-- AI FITNESS OS - SYNC SCHEMA FIX
-- Migration: 20260819000000_sync_schema_fix.sql
-- Purpose: Align DB schema with sync service expectations
-- ==========================================================

-- 1. Add missing columns to measurements
ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Drop existing primary key constraint and recreate with TEXT id
-- measurements currently has UUID id; we add client_id as the sync identifier
CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_client_id
  ON public.measurements(user_id, client_id)
  WHERE client_id IS NOT NULL;

-- 2. Add missing columns to activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_client_id
  ON public.activities(user_id, client_id)
  WHERE client_id IS NOT NULL;

-- 3. Add missing columns to meals
ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS name VARCHAR(200);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meals_client_id
  ON public.meals(user_id, client_id)
  WHERE client_id IS NOT NULL;

-- 4. Add missing columns to workouts
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS logged_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_client_id
  ON public.workouts(user_id, client_id)
  WHERE client_id IS NOT NULL;

-- 5. Add missing columns to workout_exercises
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS exercise_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6, 2);

-- Fix workout_exercises: add unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_exercises_workout_order
  ON public.workout_exercises(workout_id, order_index);

-- 6. Fix pending_whatsapp_meals RLS type mismatch
-- The existing DELETE policy uses auth.uid() = profile_id but profile_id is TEXT
DROP POLICY IF EXISTS "Users can delete own pending meals" ON public.pending_whatsapp_meals;
CREATE POLICY "Users can delete own pending meals"
  ON public.pending_whatsapp_meals FOR DELETE
  USING (auth.uid()::text = profile_id);

-- 7. WhatsApp linking tokens (persistent, not in-memory)
CREATE TABLE IF NOT EXISTS public.whatsapp_linking_tokens (
  token TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_linking_tokens_profile
  ON public.whatsapp_linking_tokens(profile_id);

-- Cleanup old tokens (run periodically or via cron)
-- DELETE FROM whatsapp_linking_tokens WHERE expires_at < NOW() - INTERVAL '1 day';
