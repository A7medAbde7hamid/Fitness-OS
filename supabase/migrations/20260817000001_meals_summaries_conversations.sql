-- ==========================================================
-- AI FITNESS OS - POSTGRESQL SCHEMA MIGRATION
-- Migration: 20260817000001_meals_summaries_conversations.sql
-- Modules: Meals & Food Items, Daily Summaries, AI Conversations & Messages
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================
-- 1. MEALS & FOOD_ITEMS TABLES
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_calories INT NOT NULL DEFAULT 0 CHECK (total_calories >= 0),
  total_protein NUMERIC(6, 1) NOT NULL DEFAULT 0 CHECK (total_protein >= 0),
  total_carbs NUMERIC(6, 1) NOT NULL DEFAULT 0 CHECK (total_carbs >= 0),
  total_fat NUMERIC(6, 1) NOT NULL DEFAULT 0 CHECK (total_fat >= 0),
  image_url TEXT,
  ai_analyzed BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence NUMERIC(4, 2) DEFAULT NULL,
  user_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  portion VARCHAR(100) NOT NULL,
  grams NUMERIC(6, 1) DEFAULT NULL,
  calories INT NOT NULL DEFAULT 0,
  protein NUMERIC(6, 1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fat NUMERIC(6, 1) NOT NULL DEFAULT 0,
  confidence NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 2. DAILY_SUMMARIES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calories_consumed INT NOT NULL DEFAULT 0,
  calories_target INT NOT NULL,
  protein_consumed_grams NUMERIC(6, 1) NOT NULL DEFAULT 0,
  protein_target_grams INT NOT NULL,
  carbs_consumed_grams NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fat_consumed_grams NUMERIC(6, 1) NOT NULL DEFAULT 0,
  steps INT NOT NULL DEFAULT 0,
  step_target INT NOT NULL DEFAULT 10000,
  active_minutes INT NOT NULL DEFAULT 0,
  active_calories INT NOT NULL DEFAULT 0,
  water_ml INT NOT NULL DEFAULT 0,
  sleep_hours NUMERIC(4, 1) DEFAULT NULL,
  readiness_score INT DEFAULT NULL CHECK (readiness_score BETWEEN 0 AND 100),
  weight_kg NUMERIC(5, 2) DEFAULT NULL,
  workout_completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_daily_summary_date UNIQUE (user_id, date)
);

-- ==========================================================
-- 3. AI_CONVERSATIONS & AI_MESSAGES TABLES
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title VARCHAR(150) DEFAULT 'Coaching Session',
  context_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  tool_calls JSONB DEFAULT NULL,
  proposed_action JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- INDEXES FOR PERFORMANCE & FAST RETRIEVAL
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_meals_user_logged ON public.meals(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_items_meal_id ON public.food_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_convo_created ON public.ai_messages(conversation_id, created_at ASC);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Meals RLS (direct profile ownership)
CREATE POLICY "Users can view own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- Food Items RLS (via parent meal ownership)
CREATE POLICY "Users can manage food items for own meals"
  ON public.food_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE public.meals.id = public.food_items.meal_id
      AND public.meals.user_id = auth.uid()
    )
  );

-- Daily Summaries RLS
CREATE POLICY "Users can view own daily summaries"
  ON public.daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily summaries"
  ON public.daily_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily summaries"
  ON public.daily_summaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily summaries"
  ON public.daily_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- AI Conversations RLS
CREATE POLICY "Users can manage own ai conversations"
  ON public.ai_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI Messages RLS (via conversation ownership)
CREATE POLICY "Users can manage messages in own ai conversations"
  ON public.ai_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE public.ai_conversations.id = public.ai_messages.conversation_id
      AND public.ai_conversations.user_id = auth.uid()
    )
  );

-- ==========================================================
-- TRIGGERS
-- ==========================================================
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at
  BEFORE UPDATE ON public.daily_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
