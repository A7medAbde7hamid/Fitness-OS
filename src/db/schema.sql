-- ==========================================================
-- AI FITNESS OS - POSTGRESQL / SUPABASE PRODUCTION SCHEMA
-- File: src/db/schema.sql
-- Bilingual Personal AI Fitness & Wellness OS (English & Arabic RTL)
-- Supports: Profiles, Goals, Measurements, Activities, Meals, Workouts, AI Conversations, Daily Summaries
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  preferred_language VARCHAR(5) DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
  unit_system VARCHAR(10) DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  current_weight_kg NUMERIC(5, 2) NOT NULL,
  height_cm NUMERIC(5, 2) NOT NULL,
  target_weight_kg NUMERIC(5, 2) NOT NULL,
  target_date DATE NOT NULL,
  primary_goal VARCHAR(30) NOT NULL CHECK (primary_goal IN ('fat_loss', 'muscle_gain', 'fitness_improvement', 'general_wellness')),
  activity_level VARCHAR(30) NOT NULL CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
  training_frequency INT DEFAULT 4 CHECK (training_frequency BETWEEN 1 AND 7),
  birth_year INT,
  gender VARCHAR(20) DEFAULT 'male',
  timezone VARCHAR(50) DEFAULT 'UTC',
  notification_preference BOOLEAN DEFAULT TRUE,
  daily_calorie_target INT NOT NULL,
  daily_protein_target_grams INT NOT NULL,
  daily_carbs_target_grams INT NOT NULL,
  daily_fat_target_grams INT NOT NULL,
  daily_step_target INT DEFAULT 10000,
  daily_water_target_ml INT DEFAULT 2800,
  onboarding_completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GOALS TABLE (Specific fitness & body composition milestones)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('weight', 'body_fat', 'strength', 'endurance', 'habit', 'nutrition')),
  metric_type VARCHAR(50) NOT NULL,
  start_value NUMERIC(7, 2) NOT NULL,
  current_value NUMERIC(7, 2) NOT NULL,
  target_value NUMERIC(7, 2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused', 'abandoned')),
  ai_recommended BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER_PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  unit_system VARCHAR(10) DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  ai_coach_personality VARCHAR(30) DEFAULT 'encouraging' CHECK (ai_coach_personality IN ('encouraging', 'direct', 'scientific', 'holistic')),
  macro_split_preset VARCHAR(30) DEFAULT 'balanced' CHECK (macro_split_preset IN ('balanced', 'high_protein', 'low_carb', 'keto', 'custom')),
  protein_ratio NUMERIC(3, 2) DEFAULT 0.30,
  carbs_ratio NUMERIC(3, 2) DEFAULT 0.40,
  fat_ratio NUMERIC(3, 2) DEFAULT 0.30,
  meal_reminder_enabled BOOLEAN DEFAULT TRUE,
  workout_reminder_enabled BOOLEAN DEFAULT TRUE,
  water_reminder_enabled BOOLEAN DEFAULT TRUE,
  weekly_report_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEASUREMENTS TABLE
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  weight_kg NUMERIC(5, 2) NOT NULL,
  body_fat_percentage NUMERIC(4, 1),
  chest_cm NUMERIC(5, 1),
  waist_cm NUMERIC(5, 1),
  hips_cm NUMERIC(5, 1),
  arms_cm NUMERIC(5, 1),
  thighs_cm NUMERIC(5, 1),
  notes TEXT,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MEALS TABLE
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  total_calories INT NOT NULL DEFAULT 0,
  total_protein NUMERIC(5, 1) NOT NULL DEFAULT 0,
  total_carbs NUMERIC(5, 1) NOT NULL DEFAULT 0,
  total_fat NUMERIC(5, 1) NOT NULL DEFAULT 0,
  image_url TEXT,
  ai_analyzed BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC(3, 2),
  user_confirmed BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FOOD_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name VARCHAR(150) NOT NULL,
  portion VARCHAR(100) NOT NULL,
  grams NUMERIC(6, 1),
  calories INT NOT NULL,
  protein NUMERIC(5, 1) NOT NULL,
  carbs NUMERIC(5, 1) NOT NULL,
  fat NUMERIC(5, 1) NOT NULL,
  confidence NUMERIC(3, 2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  activity_type VARCHAR(30) NOT NULL,
  duration_minutes INT NOT NULL,
  distance_km NUMERIC(5, 2),
  calories_burned INT NOT NULL DEFAULT 0,
  steps INT DEFAULT 0,
  source VARCHAR(30) DEFAULT 'manual',
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WORKOUTS TABLE
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  duration_minutes INT DEFAULT 45,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  calories_burned INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WORKOUT_EXERCISES TABLE
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50),
  target_sets INT DEFAULT 3,
  target_reps INT DEFAULT 10,
  rest_seconds INT DEFAULT 90,
  sets_json JSONB DEFAULT '[]'::jsonb,
  notes TEXT
);

-- 10. AI_CONVERSATIONS & AI_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  title VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  proposed_action JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DAILY_SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  date DATE NOT NULL,
  calories_consumed INT DEFAULT 0,
  calories_target INT NOT NULL,
  protein_consumed_grams NUMERIC(5, 1) DEFAULT 0,
  protein_target_grams INT NOT NULL,
  carbs_consumed_grams NUMERIC(5, 1) DEFAULT 0,
  fat_consumed_grams NUMERIC(5, 1) DEFAULT 0,
  steps INT DEFAULT 0,
  step_target INT DEFAULT 10000,
  active_minutes INT DEFAULT 0,
  active_calories INT DEFAULT 0,
  water_ml INT DEFAULT 0,
  sleep_hours NUMERIC(3, 1),
  readiness_score INT CHECK (readiness_score BETWEEN 0 AND 100),
  weight_kg NUMERIC(5, 2),
  workout_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_user_id ON public.measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.measurements(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_items_meal_id ON public.food_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.activities(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_convo_id ON public.ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, date DESC);

-- ==========================================================
-- TRIGGERS: auto-update updated_at columns
-- ==========================================================
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON public.measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own measurements" ON public.measurements
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meals" ON public.meals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own food items" ON public.food_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE public.meals.id = public.food_items.meal_id
      AND public.meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own activities" ON public.activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workouts" ON public.workouts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workout exercises" ON public.workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own ai conversations" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ai messages" ON public.ai_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE public.ai_conversations.id = public.ai_messages.conversation_id
      AND public.ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own daily summaries" ON public.daily_summaries
  FOR ALL USING (auth.uid() = user_id);
