/**
 * AI Tools for Gemini Function Calling
 * All tools use Zod schemas for strict validation.
 * Read tools only return user-scoped data.
 * Write tools validate input, authorize user, execute via deterministic services.
 */

import { z } from 'zod';
import { AppStorageRepository } from '../db/storage';
import { GoalService } from './goal';
import { NutritionService } from './nutrition';
import { ActivityService } from './activity';
import { FoodAnalysisService } from './foodAnalysisService';
import { MealConfirmationService } from './mealConfirmationService';
import { WorkoutService } from './workout';
import {
  MealType,
  UserProfile,
  Goal,
  Meal,
  WeightMeasurement,
  ActivityLog,
  WorkoutSession,
  DailySummary,
  AIConversationMessage,
  AICoachRole,
} from '../types';

// ── Tool Registry ──

export interface AIToolDefinition<TArgs = Record<string, unknown>> {
  name: string;
  description: string;
  descriptionAr: string;
  parameters: Record<string, unknown>;
  requiresConfirmation: boolean;
  schema: z.ZodType<TArgs>;
  execute: (args: TArgs, userId: string, language: 'en' | 'ar') => Promise<AIToolResult> | AIToolResult;
}

export interface AIToolResult {
  success: boolean;
  message: string;
  messageAr?: string;
  data?: unknown;
  actionTaken?: string;
  requiresConfirmation?: boolean;
  confirmationPayload?: Record<string, unknown>;
  confidence?: number;
}

// ── Zod Schemas ──

const WeightInputSchema = z.object({
  weight_kg: z.number().min(20).max(300),
  notes: z.string().optional(),
});

type WeightInput = z.infer<typeof WeightInputSchema>;

const ActivityInputSchema = z.object({
  activity_type: z.enum(['steps', 'walking', 'running', 'cycling', 'swimming', 'hiit', 'other']),
  duration_minutes: z.number().min(1).max(1440),
  steps: z.number().optional(),
  distance_km: z.number().optional(),
});

type ActivityInput = z.infer<typeof ActivityInputSchema>;

const MealTextSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

type MealText = z.infer<typeof MealTextSchema>;

const WorkoutInputSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  duration_minutes: z.number().min(1).max(180),
  exercises: z.array(z.object({
    name: z.string().min(1),
    category: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body']),
    target_sets: z.number().min(1).max(10),
    target_reps: z.string().min(1),
    rest_seconds: z.number().min(30).max(300),
    default_weight_kg: z.number().optional(),
  })).optional(),
  mark_completed: z.boolean().optional(),
});

type WorkoutInput = z.infer<typeof WorkoutInputSchema>;

// ── Read Tools ──

type ReadOnlyArgs = Record<string, never>;

export const ReadTools: AIToolDefinition<ReadOnlyArgs>[] = [
  {
    name: 'get_profile',
    description: 'Get the current user profile including weight targets, goals, and daily nutrition targets.',
    descriptionAr: 'الحصول على ملف المستخدم الشخصي بما في ذلك أهداف الوزن والسعرات اليومية.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const profile = AppStorageRepository.getProfile(userId);
      const isAr = language === 'ar';
      if (!profile) {
        return { success: false, message: isAr ? 'لم يتم العثور على الملف الشخصي' : 'Profile not found.' };
      }
      return {
        success: true,
        message: isAr
          ? `ملفك الشخصي: ${profile.displayName}، وزنك الحالي ${profile.currentWeightKg} كجم، الهدف ${profile.targetWeightKg} كجم.`
          : `Your profile: ${profile.displayName}, current weight ${profile.currentWeightKg} kg, target ${profile.targetWeightKg} kg.`,
        data: {
          displayName: profile.displayName,
          currentWeightKg: profile.currentWeightKg,
          heightCm: profile.heightCm,
          targetWeightKg: profile.targetWeightKg,
          primaryGoal: profile.primaryGoal,
          dailyCalorieTarget: profile.dailyCalorieTarget,
          dailyProteinTargetGrams: profile.dailyProteinTargetGrams,
          dailyCarbsTargetGrams: profile.dailyCarbsTargetGrams,
          dailyFatTargetGrams: profile.dailyFatTargetGrams,
          dailyStepTarget: profile.dailyStepTarget,
          unitSystem: profile.unitSystem,
        },
      };
    },
  },
  {
    name: 'get_goal',
    description: 'Get the user active goal including current progress, target, and status.',
    descriptionAr: 'الحصول على الهدف النشط للمستخدم مع تقدمه وحالته.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const goal = GoalService.getActiveGoal(userId);
      const isAr = language === 'ar';
      if (!goal) {
        return { success: true, message: isAr ? 'ليس لديك هدف نشط.' : 'No active goal found.' };
      }
      const progress = goal.targetValue !== goal.startValue
        ? Math.round(((goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue)) * 100)
        : 0;
      return {
        success: true,
        message: isAr
          ? `هدفك النشط: ${goal.title}. التقدم: ${progress}% (${goal.currentValue}/${goal.targetValue} ${goal.metricType})`
          : `Your active goal: ${goal.title}. Progress: ${progress}% (${goal.currentValue}/${goal.targetValue} ${goal.metricType})`,
        data: {
          id: goal.id,
          title: goal.title,
          startValue: goal.startValue,
          currentValue: goal.currentValue,
          targetValue: goal.targetValue,
          progressPercent: progress,
          status: goal.status,
          metricType: goal.metricType,
        },
      };
    },
  },
  {
    name: 'get_daily_summary',
    description: 'Get today summary including calories consumed, steps, protein intake, and workout status.',
    descriptionAr: 'الحصول على ملخص اليوم اليومي بما في ذلك السعرات المستهلكة والخطوات والبروتين.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const today = new Date().toISOString().split('T')[0];
      const summary = AppStorageRepository.getDailySummary(userId, today);
      const isAr = language === 'ar';

      if (!summary) {
        return {
          success: true,
          message: isAr ? 'لا يوجد ملخص لليوم بعد.' : 'No daily summary for today yet.',
          data: null,
        };
      }

      const caloriesRemaining = summary.caloriesTarget - summary.caloriesConsumed;

      return {
        success: true,
        message: isAr
          ? `ملخص اليوم: ${summary.caloriesConsumed}/${summary.caloriesTarget} سعرة (${Math.round(caloriesRemaining)} متبقية)، ${summary.steps} خطوة، بروتين ${summary.proteinConsumedGrams}/${summary.proteinTargetGrams}جم`
          : `Today: ${summary.caloriesConsumed}/${summary.caloriesTarget} kcal (${Math.round(caloriesRemaining)} remaining), ${summary.steps} steps, protein ${summary.proteinConsumedGrams}/${summary.proteinTargetGrams}g`,
        data: {
          date: summary.date,
          caloriesConsumed: summary.caloriesConsumed,
          caloriesTarget: summary.caloriesTarget,
          caloriesRemaining: Math.round(caloriesRemaining),
          proteinConsumedGrams: summary.proteinConsumedGrams,
          proteinTargetGrams: summary.proteinTargetGrams,
          carbsConsumedGrams: summary.carbsConsumedGrams,
          fatConsumedGrams: summary.fatConsumedGrams,
          steps: summary.steps,
          stepTarget: summary.stepTarget,
          activeMinutes: summary.activeMinutes,
          activeCalories: summary.activeCalories,
          waterMl: summary.waterMl,
          sleepHours: summary.sleepHours,
          readinessScore: summary.readinessScore,
          workoutCompleted: summary.workoutCompleted,
        },
      };
    },
  },
  {
    name: 'get_progress',
    description: 'Get progress statistics including weight loss trend, days active, meals logged, and workout history.',
    descriptionAr: 'الحصول على إحصائيات التقدم بما فيها اتجاه الوزن وأيام النشاط.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const stats = AppStorageRepository.getProgressStats(userId);
      const isAr = language === 'ar';
      return {
        success: true,
        message: isAr
          ? `بدأت بـ ${stats.startWeightKg} كجم، الآن ${stats.currentWeightKg} كجم، الهدف ${stats.targetWeightKg} كجم. التقدم: ${stats.progressPercent}%، نشط ${stats.daysActive} يوماً.`
          : `Started at ${stats.startWeightKg} kg, now ${stats.currentWeightKg} kg, target ${stats.targetWeightKg} kg. Progress: ${stats.progressPercent}%, active for ${stats.daysActive} days.`,
        data: stats,
      };
    },
  },
  {
    name: 'get_recent_meals',
    description: 'Get the 10 most recent meals with calories, macros, and meal types.',
    descriptionAr: 'الحصول على آخر 10 وجبات مع السعرات والماكروز.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const meals = AppStorageRepository.getMeals(userId).slice(0, 10);
      const isAr = language === 'ar';
      return {
        success: true,
        message: isAr
          ? `لديك ${meals.length} وجبة مسجلة حديثاً.`
          : `You have ${meals.length} recent meals logged.`,
        data: meals.map((m) => ({
          type: m.mealType,
          calories: m.totalCalories,
          protein: m.totalProtein,
          carbs: m.totalCarbs,
          fat: m.totalFat,
          date: m.loggedAt,
          confirmed: m.userConfirmed,
        })),
      };
    },
  },
  {
    name: 'get_recent_activity',
    description: 'Get the 10 most recent activity logs including steps, walking, running, cycling, etc.',
    descriptionAr: 'الحصول على آخر 10 سجلات نشاط بما فيها الخطوات والمشي.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const activities = AppStorageRepository.getActivities(userId).slice(0, 10);
      const isAr = language === 'ar';
      return {
        success: true,
        message: isAr
          ? `لديك ${activities.length} نشاط مسجل حديثاً.`
          : `You have ${activities.length} recent activities logged.`,
        data: activities.map((a) => ({
          type: a.activityType,
          duration: a.durationMinutes,
          caloriesBurned: a.caloriesBurned,
          steps: a.steps,
          distanceKm: a.distanceKm,
          date: a.loggedAt,
        })),
      };
    },
  },
  {
    name: 'get_recent_workouts',
    description: 'Get the 5 most recent workout sessions with titles, completion status, and calories burned.',
    descriptionAr: 'الحصول على آخر 5 جلسات تمرين مع العناوين والحالة.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const workouts = AppStorageRepository.getWorkouts(userId).slice(0, 5);
      const isAr = language === 'ar';
      return {
        success: true,
        message: isAr
          ? `لديك ${workouts.length} تمرين مسجل حديثاً.`
          : `You have ${workouts.length} recent workouts logged.`,
        data: workouts.map((w) => ({
          title: w.title,
          category: w.category,
          completed: w.completed,
          duration: w.durationMinutes,
          caloriesBurned: w.caloriesBurned,
          date: w.startedAt || w.completedAt || '',
          exercises: w.exercises?.length || 0,
        })),
      };
    },
  },
  {
    name: 'get_today_nutrition',
    description: 'Get today nutrition breakdown by meal type including totals and remaining targets.',
    descriptionAr: 'الحصول على تفصيل تناول الغذاء اليومي حسب نوع الوجبة.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const today = new Date().toISOString().split('T')[0];
      const meals = AppStorageRepository.getMeals(userId).filter(
        (m) => new Date(m.loggedAt).toISOString().split('T')[0] === today
      );
      const isAr = language === 'ar';
      const totals = meals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.totalCalories,
          protein: Math.round((acc.protein + m.totalProtein) * 10) / 10,
          carbs: Math.round((acc.carbs + m.totalCarbs) * 10) / 10,
          fat: Math.round((acc.fat + m.totalFat) * 10) / 10,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      return {
        success: true,
        message: isAr
          ? `اليوم: ${totals.calories} سعرة، ${totals.protein} جم بروتين، ${totals.carbs} جم نشويات، ${totals.fat} جم دهون.`
          : `Today: ${totals.calories} kcal, ${totals.protein}g protein, ${totals.carbs}g carbs, ${totals.fat}g fat.`,
        data: {
          meals: meals.map((m) => ({
            type: m.mealType,
            calories: m.totalCalories,
            protein: m.totalProtein,
            carbs: m.totalCarbs,
            fat: m.totalFat,
            time: m.loggedAt,
          })),
          totals,
        },
      };
    },
  },
  {
    name: 'get_today_activity',
    description: 'Get today activity including steps, active minutes, active calories, and water intake.',
    descriptionAr: 'الحصول على نشاط اليوم بما فيها الخطوات والدقائق النشطة.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const today = new Date().toISOString().split('T')[0];
      const summary = AppStorageRepository.getDailySummary(userId, today);
      const isAr = language === 'ar';

      if (!summary) {
        return {
          success: true,
          message: isAr ? 'لا يوجد ملخص نشاط لليوم.' : 'No activity summary for today.',
          data: null,
        };
      }

      return {
        success: true,
        message: isAr
          ? `اليوم: ${summary.steps} خطوة، ${summary.activeMinutes} دقيقة نشاط، ${summary.activeCalories} سعرة محروقة، ${summary.waterMl / 1000} لتر ماء.`
          : `Today: ${summary.steps} steps, ${summary.activeMinutes} active minutes, ${summary.activeCalories} kcal burned, ${summary.waterMl / 1000} L water.`,
        data: {
          steps: summary.steps,
          stepsTarget: summary.stepTarget,
          activeMinutes: summary.activeMinutes,
          activeCalories: summary.activeCalories,
          waterMl: summary.waterMl,
          waterTargetMl: 3000,
        },
      };
    },
  },
  {
    name: 'get_today_workout',
    description: 'Get today workout plan or completion status, including exercises and progress.',
    descriptionAr: 'الحصول على خطة تمرين اليوم أو حالة الإكمال.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const today = new Date().toISOString().split('T')[0];
      const workouts = AppStorageRepository.getWorkouts(userId);
      const todayWorkout = workouts.find(
        (w) =>
          w.startedAt &&
          new Date(w.startedAt).toISOString().split('T')[0] === today
      );
      const isAr = language === 'ar';

      if (!todayWorkout) {
        return {
          success: true,
          message: isAr ? 'لا يوجد تمرين مخطط له اليوم.' : 'No workout scheduled for today.',
          data: null,
        };
      }

      return {
        success: true,
        message: isAr
          ? `تمرين اليوم: ${todayWorkout.title} (${todayWorkout.durationMinutes} دقيقة). ${todayWorkout.completed ? 'مكتمل' : 'لم يتم إكماله بعد'}.`
          : `Today's workout: ${todayWorkout.title} (${todayWorkout.durationMinutes} mins). ${todayWorkout.completed ? 'Completed' : 'Not yet completed'}.`,
        data: {
          title: todayWorkout.title,
          category: todayWorkout.category,
          completed: todayWorkout.completed,
          duration: todayWorkout.durationMinutes,
          caloriesBurned: todayWorkout.caloriesBurned,
          exercises: todayWorkout.exercises?.map((e) => ({
            name: e.name,
            sets: e.sets?.filter((s) => s.completed).length || 0,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
          })),
        },
      };
    },
  },
  {
    name: 'get_weekly_report',
    description: 'Get weekly progress report including average weight, calorie intake, steps, and workout count.',
    descriptionAr: 'الحصول على تقرير أسبوعي بما فيته متوسط الوزن والخطوات.',
    requiresConfirmation: false,
    parameters: {},
    schema: z.object({}),
    execute: (args, userId, language) => {
      const measurements = AppStorageRepository.getMeasurements(userId);
      const meals = AppStorageRepository.getMeals(userId);
      const activities = AppStorageRepository.getActivities(userId);
      const workouts = AppStorageRepository.getWorkouts(userId);

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const isAr = language === 'ar';

      const recentMeasurements = measurements.filter(
        (m) => new Date(m.measuredAt) >= sevenDaysAgo
      );
      const recentWorkouts = workouts.filter(
        (w) => w.completed && w.completedAt && new Date(w.completedAt) >= sevenDaysAgo
      );
      const recentSteps = activities
        .filter((a) => new Date(a.loggedAt) >= sevenDaysAgo)
        .reduce((sum, a) => sum + (a.steps || 0), 0);

      const avgWeight =
        recentMeasurements.length > 0
          ? Math.round(
              (recentMeasurements.reduce((s, m) => s + m.weightKg, 0) / recentMeasurements.length) *
                10
            ) / 10
          : 0;

      const weightDelta =
        recentMeasurements.length >= 2
          ? Math.round(
              (recentMeasurements[0].weightKg - recentMeasurements[recentMeasurements.length - 1].weightKg) *
                10
            ) / 10
          : 0;

      return {
        success: true,
        message: isAr
          ? `تقرير أسبوعي: متوسط وزن ${avgWeight} كجم (تغير ${weightDelta >= 0 ? '+' : ''}${weightDelta} كجم)، ${recentWorkouts.length} تمرين مكتمل، ${recentSteps} خطوة.`
          : `Weekly report: avg weight ${avgWeight} kg (${weightDelta >= 0 ? '+' : ''}${weightDelta} kg change), ${recentWorkouts.length} workouts completed, ${recentSteps} steps.`,
        data: {
          period: '7 days',
          averageWeightKg: avgWeight,
          weightChangeKg: weightDelta,
          workoutsCompleted: recentWorkouts.length,
          totalSteps: recentSteps,
          measurementCount: recentMeasurements.length,
        },
      };
    },
  },
];

// ── Write Tools ──

export const WriteTools: AIToolDefinition<any>[] = [
  {
    name: 'log_weight',
    description: 'Log a new bodyweight measurement. Requires a numeric weight in kg between 20 and 300.',
    descriptionAr: 'تسجيل قياس وزن جديد. يتطلب وزن عددي بالكيلوجرام بين 20 و300.',
    requiresConfirmation: true,
    parameters: {},
    schema: WeightInputSchema,
    execute: (args: WeightInput, userId, language) => {
      const isAr = language === 'ar';
      const measurement: WeightMeasurement = {
        id: 'meas_' + Date.now(),
        userId,
        weightKg: args.weight_kg,
        measuredAt: new Date().toISOString(),
        notes: args.notes,
      };
      AppStorageRepository.addMeasurement(userId, measurement);

      const profile = AppStorageRepository.getProfile(userId);
      if (profile) {
        AppStorageRepository.saveProfile({ ...profile, currentWeightKg: args.weight_kg });
      }

      return {
        success: true,
        message: isAr
          ? `تم تسجيل وزنك: ${args.weight_kg} كجم.`
          : `Logged your weight: ${args.weight_kg} kg.`,
        messageAr: `تم تسجيل وزنك: ${args.weight_kg} كجم.`,
        data: { weightKg: args.weight_kg, measuredAt: measurement.measuredAt },
        actionTaken: 'log_weight',
      };
    },
  },
  {
    name: 'log_activity',
    description: 'Log physical activity, walking steps, running, cycling, etc. Requires activity type and duration.',
    descriptionAr: 'تسجيل النشاط البدني أو الخطوات أو المشي. يتطلب نوع النشاط والمدة.',
    requiresConfirmation: true,
    parameters: {},
    schema: ActivityInputSchema,
    execute: async (args: ActivityInput, userId, language) => {
      const isAr = language === 'ar';

      const log = await ActivityService.logActivity({
        userId,
        activityType: args.activity_type,
        durationMinutes: args.duration_minutes,
        steps: args.steps,
        distanceKm: args.distance_km,
      });

      return {
        success: true,
        message: isAr
          ? `تم تسجيل ${args.duration_minutes} دقيقة ${args.activity_type} (${log.caloriesBurned} سعرة محروقة).`
          : `Logged ${args.duration_minutes} mins of ${args.activity_type} (${log.caloriesBurned} kcal burned).`,
        data: {
          activityType: log.activityType,
          durationMinutes: log.durationMinutes,
          caloriesBurned: log.caloriesBurned,
          steps: log.steps,
        },
        actionTaken: 'log_activity',
      };
    },
  },
  {
    name: 'log_meal_described',
    description: 'Log a meal from a text description. The AI analyzes the description and proposes a meal for user review.',
    descriptionAr: 'تسجيل وجبة من وصف نصي. يحلل الذكاء الاصطناعي الوصف ويقترح وجبة لمراجعة المستخدم.',
    requiresConfirmation: true,
    parameters: {},
    schema: MealTextSchema,
    execute: async (args: MealText, userId, language) => {
      const isAr = language === 'ar';

      const parsed = NutritionService.parseMealDescription(args.description, language);
      const pending = MealConfirmationService.createPendingMeal(
        userId,
        args.meal_type,
        {
          items: parsed.items,
          totalCalories: parsed.totalCalories,
          totalProtein: parsed.totalProtein,
          totalCarbs: parsed.totalCarbs,
          totalFat: parsed.totalFat,
          confidence: parsed.confidence,
          confidenceLevel: FoodAnalysisService.classifyConfidence(parsed.confidence),
          source: 'text_parse',
        }
      );

      return {
        success: true,
        message: isAr
          ? `تم تحليل الوجبة: ${Math.round(parsed.totalCalories)} سعرة، ${parsed.totalProtein} جم بروتين.`
          : `Meal analyzed: ${Math.round(parsed.totalCalories)} kcal, ${parsed.totalProtein}g protein.`,
        data: {
          pendingMealId: pending.id,
          mealType: args.meal_type,
          items: parsed.items,
          totalCalories: parsed.totalCalories,
          totalProtein: parsed.totalProtein,
          totalCarbs: parsed.totalCarbs,
          totalFat: parsed.totalFat,
          confidence: parsed.confidence,
          confirmed: false,
        },
        actionTaken: 'log_meal',
        requiresConfirmation: true,
        confirmationPayload: {
          pendingMealId: pending.id,
          mealType: args.meal_type,
        },
      };
    },
  },
  {
    name: 'log_workout',
    description: 'Log or schedule a workout session with exercises, sets, and duration.',
    descriptionAr: 'تسجيل أو جدولة جلسة تمرين مع تمارين ومجموعات ومدة.',
    requiresConfirmation: true,
    parameters: {},
    schema: WorkoutInputSchema,
    execute: (args: WorkoutInput, userId, language) => {
      const isAr = language === 'ar';

      let exercises;
      if (args.exercises && args.exercises.length > 0) {
        exercises = args.exercises.map((ex) => ({
          id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: ex.name,
          category: ex.category,
          targetSets: ex.target_sets,
          targetReps: ex.target_reps,
          restSeconds: ex.rest_seconds,
          defaultWeightKg: ex.default_weight_kg,
          sets: [],
        }));
      }

      const session = WorkoutService.createWorkoutSession(userId, {
        title: args.title,
        category: args.category,
        durationMinutes: args.duration_minutes,
        exercises,
      });

      if (args.mark_completed) {
        WorkoutService.completeWorkout(userId, session.id, {
          actualDurationMinutes: args.duration_minutes,
        });
      }

      return {
        success: true,
        message: isAr
          ? `تم إنشاء التمرين "${session.title}" (${session.durationMinutes} دقيقة).`
          : `Created workout "${session.title}" (${session.durationMinutes} mins).`,
        data: {
          id: session.id,
          title: session.title,
          category: session.category,
          durationMinutes: session.durationMinutes,
          exercisesCount: session.exercises?.length || 0,
          completed: args.mark_completed || false,
        },
        actionTaken: 'log_workout',
      };
    },
  },
];

// ── Tools Export ──

const ALL_TOOLS: AIToolDefinition[] = [...ReadTools, ...WriteTools];

const TOOL_REGISTRY: Map<string, AIToolDefinition> = new Map(
  ALL_TOOLS.map((tool) => [tool.name, tool])
);

export function getTool(name: string): AIToolDefinition | undefined {
  return TOOL_REGISTRY.get(name);
}

export function getAllTools(): AIToolDefinition[] {
  return ALL_TOOLS;
}

export function getToolNames(): string[] {
  return ALL_TOOLS.map((t) => t.name);
}

export function getFunctionDeclarations() {
  return ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'OBJECT' as const,
      properties: tool.parameters,
    },
  }));
}

export function getFunctionDeclarationsAr() {
  return ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.descriptionAr,
    parameters: {
      type: 'OBJECT' as const,
      properties: tool.parameters,
    },
  }));
}
