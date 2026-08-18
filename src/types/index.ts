export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';
export type UnitSystem = 'metric' | 'imperial';

export type PrimaryGoal = 'fat_loss' | 'muscle_gain' | 'fitness_improvement' | 'general_wellness';

export type ActivityLevel =
  | 'sedentary'      // Little or no exercise
  | 'lightly_active' // 1-3 days/week
  | 'moderately_active' // 3-5 days/week
  | 'very_active'    // 6-7 days/week
  | 'extra_active';  // Very active or physical job

export type TrainingFrequency = 2 | 3 | 4 | 5 | 6 | 7;

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  preferredLanguage: Language;
  unitSystem: UnitSystem;
  currentWeightKg: number;
  heightCm: number;
  targetWeightKg: number;
  targetDate: string;
  primaryGoal: PrimaryGoal;
  activityLevel: ActivityLevel;
  trainingFrequency: TrainingFrequency;
  birthYear?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  notificationPreference: boolean;
  timezone: string;
  dailyCalorieTarget: number;
  dailyProteinTargetGrams: number;
  dailyCarbsTargetGrams: number;
  dailyFatTargetGrams: number;
  dailyStepTarget: number;
  dailyWaterTargetMl: number;
}

export interface DailySummary {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumedGrams: number;
  proteinTargetGrams: number;
  carbsConsumedGrams: number;
  fatConsumedGrams: number;
  steps: number;
  stepTarget: number;
  activeMinutes: number;
  activeCalories: number;
  waterMl: number;
  sleepHours?: number;
  readinessScore?: number; // 0 - 100
  weightKg?: number;
  workoutCompleted: boolean;
  notes?: string;
}

export interface WeightMeasurement {
  id: string;
  userId: string;
  weightKg: number;
  measuredAt: string; // ISO string
  notes?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  portion: string;
  grams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number; // 0.0 to 1.0
}

export interface Meal {
  id: string;
  userId: string;
  mealType: MealType;
  loggedAt: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  imageUrl?: string;
  aiAnalyzed: boolean;
  aiConfidence?: number;
  userConfirmed: boolean;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  activityType: 'steps' | 'walking' | 'running' | 'cycling' | 'swimming' | 'hiit' | 'other';
  durationMinutes: number;
  distanceKm?: number;
  caloriesBurned: number;
  steps?: number;
  loggedAt: string;
  source: 'manual' | 'apple_health' | 'google_fit' | 'pedometer';
}

export interface WorkoutExerciseSet {
  setNumber: number;
  reps: number;
  weightKg?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full_body';
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  sets: WorkoutExerciseSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  title: string;
  category: string;
  durationMinutes: number;
  exercises: WorkoutExercise[];
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
  caloriesBurned?: number;
  notes?: string;
}

export type AICoachRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AIChatMessage {
  id: string;
  conversationId: string;
  role: AICoachRole;
  content: string;
  createdAt: string;
  proposedAction?: {
    action: string;
    payload: Record<string, unknown>;
    status: 'pending' | 'confirmed' | 'rejected' | 'executed';
  };
}

export interface WeeklyReport {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  avgWeightKg: number;
  weightDeltaKg: number;
  rollingAvgTrend: 'losing' | 'maintaining' | 'gaining';
  avgDailyCalories: number;
  avgDailyProtein: number;
  totalSteps: number;
  workoutsCompleted: number;
  aiAnalysisText: string;
  highlights: string[];
  recommendations: string[];
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  error: string | null;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: 'weight' | 'body_fat' | 'strength' | 'endurance' | 'habit' | 'nutrition';
  metricType: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  startDate: string;
  targetDate: string;
  status: 'in_progress' | 'completed' | 'paused' | 'abandoned';
  aiRecommended?: boolean;
  notes?: string;
}

export interface ProgressStats {
  startWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number;
  weightChangeKg: number;
  progressPercent: number;
  daysActive: number;
  loggedMealsCount: number;
  completedWorkoutsCount: number;
  adherenceRate: number;
}

export type AppView = 'landing' | 'auth' | 'onboarding' | 'dashboard' | 'coach' | 'log' | 'progress' | 'profile';
export type NavTab = 'home' | 'log' | 'progress' | 'coach' | 'profile';

// ── AI Coach Conversation Memory ──

export type AIConversationRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIConversationMessage {
  id: string;
  conversationId: string;
  role: AIConversationRole;
  content: string;
  toolName?: string;
  toolPayload?: Record<string, unknown>;
  toolResult?: AIToolExecutionResult;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  titleAr?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface AIToolExecutionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  actionTaken?: string;
}

export interface AICoachResponse {
  message: string;
  language: Language;
  actions: AIToolExecutionResult[];
  requiresConfirmation: boolean;
  toolResults: AIToolExecutionResult[];
  confidence?: number;
}

// ── AI Context ──

export interface AIUserContext {
  profile: {
    displayName: string;
    currentWeightKg: number;
    heightCm: number;
    targetWeightKg: number;
    targetDate: string;
    primaryGoal: PrimaryGoal;
    activityLevel: ActivityLevel;
    dailyCalorieTarget: number;
    dailyProteinTargetGrams: number;
    dailyCarbsTargetGrams: number;
    dailyFatTargetGrams: number;
    dailyStepTarget: number;
    unitSystem: UnitSystem;
  };
  activeGoal: Goal | null;
  weightTrend7d: { date: string; weightKg: number }[];
  today: {
    summary: DailySummary | null;
    meals: Meal[];
    activities: ActivityLog[];
    workouts: WorkoutSession[];
  };
  recent: {
    meals: Meal[];
    workouts: WorkoutSession[];
    activities: ActivityLog[];
    measurements: WeightMeasurement[];
  };
  dailyRecommendation?: {
    caloriesRemaining: number;
    proteinRemaining: number;
    focus: string;
    suggestedWorkout?: string;
  };
}

// ── Phase 5: Offline Sync ──

export type SyncOperationType = 'log_weight' | 'log_activity' | 'log_meal' | 'log_workout' | 'update_workout';

export type SyncOperationStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  status: SyncOperationStatus;
  lastError?: string;
  userId: string;
}

// ── Phase 5: Connection Status ──

export type ConnectionStatusType = 'online' | 'offline' | 'syncing' | 'synced' | 'sync_error';

// ── Phase 5: Daily Check-in ──

export type FeelingLevel = 'great' | 'good' | 'okay' | 'tired' | 'bad';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type HungerLevel = 'very_hungry' | 'hungry' | 'normal' | 'not_hungry';
export type SleepQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface DailyCheckIn {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  feeling: FeelingLevel;
  energy: EnergyLevel;
  hunger: HungerLevel;
  sleep: SleepQuality;
  note?: string;
  createdAt: string;
}

// ── Phase 5: Notification Preferences (extended) ──

export type NotificationType = 'daily_checkin' | 'workout_reminder' | 'weigh_in_reminder' | 'weekly_report';

export interface NotificationPreferences {
  userId: string;
  dailyCheckin: { enabled: boolean; preferredTime: string; timezone: string };
  workoutReminder: { enabled: boolean; preferredTime: string; timezone: string };
  weighInReminder: { enabled: boolean; preferredTime: string; timezone: string };
  weeklyReport: { enabled: boolean; preferredTime: string; timezone: string };
}

// ── Phase 5: Weekly Report (extended) ──

export interface WeeklyReportData {
  userId: string;
  startDate: string;
  endDate: string;
  weight: {
    startKg: number;
    endKg: number;
    deltaKg: number;
    avgKg: number;
    trend: 'losing' | 'maintaining' | 'gaining';
    dailyWeights: { date: string; weightKg: number }[];
  };
  nutrition: {
    avgDailyCalories: number;
    avgDailyProtein: number;
    avgDailyCarbs: number;
    avgDailyFat: number;
    totalMealsLogged: number;
    daysWithMealsLogged: number;
  };
  activity: {
    totalSteps: number;
    avgDailySteps: number;
    totalActiveMinutes: number;
    daysActive: number;
  };
  workout: {
    workoutsCompleted: number;
    totalDurationMinutes: number;
    avgDurationMinutes: number;
    categories: Record<string, number>;
  };
  consistency: {
    daysTracked: number;
    checkInsCompleted: number;
    mealsLogged: number;
    weightLogged: number;
  };
}

// ── Phase 7: WhatsApp Integration ──

export type WhatsAppProviderType = 'cloud_api' | 'mock';
export type WhatsAppMessageType = 'text' | 'image' | 'audio' | 'document' | 'location';
export type WhatsAppConnectionStatus = 'pending' | 'verified' | 'disconnected';

export interface WhatsAppNormalizedMessage {
  provider: WhatsAppProviderType;
  senderId: string;
  messageId: string;
  timestamp: string;
  type: WhatsAppMessageType;
  text?: string;
  media?: {
    mimeType: string;
    url: string;
    caption?: string;
    sizeBytes?: number;
  };
  metadata: Record<string, unknown>;
}

export interface WhatsAppConnection {
  id: string;
  profileId: string;
  provider: WhatsAppProviderType;
  externalUserId: string;
  phoneReference?: string;
  status: WhatsAppConnectionStatus;
  language: Language;
  verifiedAt?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppLinkingToken {
  token: string;
  profileId: string;
  expiresAt: string;
  used: boolean;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: Record<string, unknown>;
        contacts?: Array<{ wa_id: string; profile: { name: string } }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string; caption?: string };
          audio?: { id: string; mime_type: string };
          document?: { id: string; mime_type: string; filename?: string; caption?: string };
          location?: { latitude: number; longitude: number; name?: string; address?: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppProvider {
  sendText(to: string, text: string): Promise<{ messageId: string; success: boolean }>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<{ messageId: string; success: boolean }>;
  sendInteractive(to: string, body: string, buttons: Array<{ id: string; title: string }>): Promise<{ messageId: string; success: boolean }>;
  markAsRead(messageId: string): Promise<boolean>;
  verifyWebhook(mode: string, token: string, challenge?: string): string | null;
  downloadMedia(mediaId: string): Promise<{ mimeType: string; data: Buffer }>;
}
