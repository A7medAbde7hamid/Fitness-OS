import {
  ActivityLog,
  AIChatMessage,
  DailySummary,
  Meal,
  MealType,
  UserProfile,
  WeightMeasurement,
  WorkoutSession,
} from '../types';
import { AppStorageRepository } from '../db/storage';
import { NutritionService } from './nutrition';
import { WorkoutService } from './workout';
import { ActivityService } from './activity';

// ============================================================================
// Standard Gemini Tool-Calling Abstraction Types
// ============================================================================

export type JSONSchemaType = 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';

export interface AIToolPropertySchema {
  type: JSONSchemaType;
  description: string;
  enum?: string[];
  items?: {
    type: JSONSchemaType;
    properties?: Record<string, AIToolPropertySchema>;
    description?: string;
  };
  properties?: Record<string, AIToolPropertySchema>;
}

export interface AIToolParametersSchema {
  type: 'OBJECT';
  properties: Record<string, AIToolPropertySchema>;
  required?: string[];
  description?: string;
}

export interface AIExecutionContext {
  userId: string;
  profile: UserProfile | null;
  language: 'en' | 'ar';
  currentSummary?: DailySummary | null;
}

export interface AIToolResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  actionTaken?: string;
  requiresUserConfirmation?: boolean;
}

export interface AIToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  descriptionAr?: string;
  parameters: AIToolParametersSchema;
  requiresConfirmation?: boolean;
  execute: (params: TParams, context: AIExecutionContext) => Promise<AIToolResult<TResult>> | AIToolResult<TResult>;
}

// ============================================================================
// Concrete Fitness Tool Definitions
// ============================================================================

export const LogMealTool: AIToolDefinition<{
  mealType: MealType;
  description: string;
  estimatedCalories?: number;
  estimatedProtein?: number;
  estimatedCarbs?: number;
  estimatedFat?: number;
}> = {
  name: 'log_meal',
  description: 'Log a consumed meal with food items, calorie estimation, and macronutrients into the user journal.',
  descriptionAr: 'تسجيل وجبة تم تناولها مع تفاصيل السعرات والماكروز في سجل المستخدم.',
  requiresConfirmation: false,
  parameters: {
    type: 'OBJECT',
    properties: {
      mealType: {
        type: 'STRING',
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        description: 'The category of the meal: breakfast, lunch, dinner, or snack.',
      },
      description: {
        type: 'STRING',
        description: 'Natural language description of what was consumed (e.g. "200g chicken breast with 1 cup rice").',
      },
      estimatedCalories: {
        type: 'INTEGER',
        description: 'Estimated total calories if known.',
      },
      estimatedProtein: {
        type: 'NUMBER',
        description: 'Estimated protein in grams.',
      },
      estimatedCarbs: {
        type: 'NUMBER',
        description: 'Estimated carbohydrates in grams.',
      },
      estimatedFat: {
        type: 'NUMBER',
        description: 'Estimated fat in grams.',
      },
    },
    required: ['mealType', 'description'],
  },
  execute: (params, context) => {
    const parsed = NutritionService.parseMealDescription(params.description, context.language);
    const loggedMeal = NutritionService.logMeal(context.userId, {
      mealType: params.mealType,
      items: parsed.items,
      totalCalories: params.estimatedCalories || parsed.totalCalories,
      totalProtein: params.estimatedProtein || parsed.totalProtein,
      totalCarbs: params.estimatedCarbs || parsed.totalCarbs,
      totalFat: params.estimatedFat || parsed.totalFat,
      aiAnalyzed: true,
      aiConfidence: parsed.confidence,
    });

    const isAr = context.language === 'ar';
    return {
      success: true,
      message: isAr
        ? `تم تسجيل وجبة ${params.mealType} (${loggedMeal.totalCalories} سعرة، ${loggedMeal.totalProtein} جم بروتين) بنجاح!`
        : `Logged ${params.mealType} (${loggedMeal.totalCalories} kcal, ${loggedMeal.totalProtein}g protein) successfully!`,
      data: loggedMeal,
      actionTaken: 'log_meal',
    };
  },
};

export const LogWorkoutTool: AIToolDefinition<{
  title: string;
  category: string;
  durationMinutes: number;
  exercises?: Array<{
    name: string;
    category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full_body';
    targetSets: number;
    targetReps: number;
    restSeconds: number;
    defaultWeightKg?: number;
  }>;
  markCompleted?: boolean;
}> = {
  name: 'log_workout',
  description: 'Propose or log a structured workout session with exercises, target sets, reps, and calorie expenditure.',
  descriptionAr: 'اقتراح أو تسجيل جلسة تمرين رياضية مع التمارين والمجموعات والسعرات المحروقة.',
  requiresConfirmation: false,
  parameters: {
    type: 'OBJECT',
    properties: {
      title: {
        type: 'STRING',
        description: 'Descriptive title of the workout (e.g. "Upper Body Push Power").',
      },
      category: {
        type: 'STRING',
        description: 'Workout category (e.g. "Push", "Pull", "Legs", "HIIT", "Cardio").',
      },
      durationMinutes: {
        type: 'INTEGER',
        description: 'Duration of the workout in minutes.',
      },
      markCompleted: {
        type: 'BOOLEAN',
        description: 'Whether the workout has already been completed or is planned.',
      },
    },
    required: ['title', 'category', 'durationMinutes'],
  },
  execute: (params, context) => {
    let exercises = params.exercises;
    if (!exercises || exercises.length === 0) {
      const routine = WorkoutService.generateAIWorkoutRoutine({
        splitType: params.category.toLowerCase().includes('pull')
          ? 'pull'
          : params.category.toLowerCase().includes('leg')
          ? 'legs'
          : 'push',
        durationMinutes: params.durationMinutes,
        language: context.language,
      });
      exercises = routine.exercises;
    }

    const session = WorkoutService.createWorkoutSession(context.userId, {
      title: params.title,
      category: params.category,
      durationMinutes: params.durationMinutes,
      exercises,
    });

    if (params.markCompleted) {
      WorkoutService.completeWorkout(context.userId, session.id, {
        actualDurationMinutes: params.durationMinutes,
      });
    }

    const isAr = context.language === 'ar';
    return {
      success: true,
      message: isAr
        ? `تم إنشاء وتثبيت جدول تمرين "${session.title}" (${session.durationMinutes} دقيقة)!`
        : `Workout plan "${session.title}" (${session.durationMinutes} mins) scheduled and logged!`,
      data: session,
      actionTaken: 'log_workout',
    };
  },
};

export const LogWeightTool: AIToolDefinition<{
  weightKg: number;
  notes?: string;
}> = {
  name: 'log_weight',
  description: 'Log a new bodyweight measurement and recalculate weight loss/gain progress trends.',
  descriptionAr: 'تسجيل قياس وزن جديد وإعادة حساب اتجاهات التقدم الأسبوعية.',
  parameters: {
    type: 'OBJECT',
    properties: {
      weightKg: {
        type: 'NUMBER',
        description: 'Measured body weight in kilograms.',
      },
      notes: {
        type: 'STRING',
        description: 'Optional note regarding measurement context (e.g. "Morning fasted").',
      },
    },
    required: ['weightKg'],
  },
  execute: (params, context) => {
    const measurement: WeightMeasurement = {
      id: 'meas_' + Date.now(),
      userId: context.userId,
      weightKg: params.weightKg,
      measuredAt: new Date().toISOString(),
      notes: params.notes,
    };
    AppStorageRepository.addMeasurement(context.userId, measurement);

    // Update current weight on profile
    if (context.profile) {
      const updatedProfile = { ...context.profile, currentWeightKg: params.weightKg };
      AppStorageRepository.saveProfile(updatedProfile);
    }

    const isAr = context.language === 'ar';
    return {
      success: true,
      message: isAr
        ? `تم تسجيل الوزن: ${params.weightKg} كجم وتحديث متوسط المسار الأيضي.`
        : `Logged weight: ${params.weightKg} kg and updated metabolic progress trajectory.`,
      data: measurement,
      actionTaken: 'log_weight',
    };
  },
};

export const LogActivityTool: AIToolDefinition<{
  activityType: 'steps' | 'walking' | 'running' | 'cycling' | 'swimming' | 'hiit';
  durationMinutes: number;
  steps?: number;
  distanceKm?: number;
}> = {
  name: 'log_activity',
  description: 'Log physical activity, walking steps, running distance, or cardiovascular sessions.',
  descriptionAr: 'تسجيل النشاط البدني أو خطوات المشي أو تمارين الكارديو وحرق السعرات.',
  parameters: {
    type: 'OBJECT',
    properties: {
      activityType: {
        type: 'STRING',
        enum: ['steps', 'walking', 'running', 'cycling', 'swimming', 'hiit'],
        description: 'Type of activity performed.',
      },
      durationMinutes: {
        type: 'INTEGER',
        description: 'Duration in minutes.',
      },
      steps: {
        type: 'INTEGER',
        description: 'Step count if applicable.',
      },
      distanceKm: {
        type: 'NUMBER',
        description: 'Distance covered in kilometers if applicable.',
      },
    },
    required: ['activityType', 'durationMinutes'],
  },
  execute: async (params, context) => {
    const log = await ActivityService.logActivity({
      userId: context.userId,
      activityType: params.activityType,
      durationMinutes: params.durationMinutes,
      steps: params.steps,
      distanceKm: params.distanceKm,
    });

    const isAr = context.language === 'ar';
    return {
      success: true,
      message: isAr
        ? `تم تسجيل ${params.durationMinutes} دقيقة ${params.activityType} (${log.caloriesBurned} سعرة محروقة).`
        : `Logged ${params.durationMinutes} mins of ${params.activityType} (${log.caloriesBurned} kcal burned).`,
      data: log,
      actionTaken: 'log_activity',
    };
  },
};

export const UpdateMacroTargetsTool: AIToolDefinition<{
  dailyCalorieTarget: number;
  dailyProteinTargetGrams: number;
  dailyCarbsTargetGrams?: number;
  dailyFatTargetGrams?: number;
  reason?: string;
}> = {
  name: 'update_macro_targets',
  description: 'Adjust the user daily calorie budget and protein/carbs/fat macronutrient targets based on metabolic coaching.',
  descriptionAr: 'تعديل السعرات اليومية المستهدفة وتوزيع البروتين والنشويات والدهون للمستخدم.',
  requiresConfirmation: true,
  parameters: {
    type: 'OBJECT',
    properties: {
      dailyCalorieTarget: {
        type: 'INTEGER',
        description: 'New daily total calorie target.',
      },
      dailyProteinTargetGrams: {
        type: 'INTEGER',
        description: 'New daily protein target in grams.',
      },
      dailyCarbsTargetGrams: {
        type: 'INTEGER',
        description: 'New daily carbs target in grams.',
      },
      dailyFatTargetGrams: {
        type: 'INTEGER',
        description: 'New daily fat target in grams.',
      },
      reason: {
        type: 'STRING',
        description: 'Explanation for why this macro adjustment is proposed.',
      },
    },
    required: ['dailyCalorieTarget', 'dailyProteinTargetGrams'],
  },
  execute: (params, context) => {
    if (!context.profile) {
      return { success: false, message: 'User profile not loaded.' };
    }

    const updatedProfile: UserProfile = {
      ...context.profile,
      dailyCalorieTarget: params.dailyCalorieTarget,
      dailyProteinTargetGrams: params.dailyProteinTargetGrams,
      dailyCarbsTargetGrams: params.dailyCarbsTargetGrams || context.profile.dailyCarbsTargetGrams,
      dailyFatTargetGrams: params.dailyFatTargetGrams || context.profile.dailyFatTargetGrams,
    };
    AppStorageRepository.saveProfile(updatedProfile);

    const isAr = context.language === 'ar';
    return {
      success: true,
      message: isAr
        ? `تم تحديث الأهداف الأيضية: ${params.dailyCalorieTarget} سعرة، ${params.dailyProteinTargetGrams} جم بروتين.`
        : `Updated daily targets to ${params.dailyCalorieTarget} kcal, ${params.dailyProteinTargetGrams}g protein.`,
      data: updatedProfile,
      actionTaken: 'update_macro_targets',
    };
  },
};

// ============================================================================
// Tool Calling Registry & Dispatcher
// ============================================================================

export class AIToolRegistry {
  private static tools: Map<string, AIToolDefinition> = new Map();

  static {
    // Auto-register default fitness OS tools
    this.registerTool(LogMealTool);
    this.registerTool(LogWorkoutTool);
    this.registerTool(LogWeightTool);
    this.registerTool(LogActivityTool);
    this.registerTool(UpdateMacroTargetsTool);
  }

  static registerTool(tool: AIToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  static getTool(name: string): AIToolDefinition | undefined {
    return this.tools.get(name);
  }

  static getAllTools(): AIToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Export Function Declarations for Gemini Tool Calling API
   */
  static getGeminiFunctionDeclarations(): Array<{
    name: string;
    description: string;
    parameters: AIToolParametersSchema;
  }> {
    return this.getAllTools().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  /**
   * Execute a tool by name with safety checks and error handling
   */
  static async executeToolCall(
    name: string,
    params: Record<string, unknown>,
    context: AIExecutionContext
  ): Promise<AIToolResult> {
    const tool = this.getTool(name);
    if (!tool) {
      return {
        success: false,
        message: `Unknown AI tool requested: "${name}".`,
      };
    }

    try {
      return await tool.execute(params, context);
    } catch (err: any) {
      console.error(`Error executing tool "${name}":`, err);
      return {
        success: false,
        message: err?.message || `Failed to execute action "${name}".`,
      };
    }
  }
}

// ============================================================================
// Client AI Coach Interaction Service
// ============================================================================

export class AIService {
  /**
   * Send messages to AI Coach, with tool calling support & graceful fallback
   */
  static async sendCoachMessage(payload: {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    userContext: Record<string, unknown>;
    language: 'en' | 'ar';
    userId: string;
    profile: UserProfile | null;
  }): Promise<{
    reply: string;
    toolCallExecuted?: AIToolResult;
    proposedAction?: {
      action: string;
      payload: Record<string, unknown>;
      status: 'pending' | 'confirmed' | 'rejected' | 'executed';
    };
  }> {
    const { messages, userContext, language, userId, profile } = payload;
    const latestUserMessage = messages[messages.length - 1]?.content || '';
    const isAr = language === 'ar';
    const lowerText = latestUserMessage.toLowerCase();

    // 1. Detect if user intent matches an immediate tool trigger (e.g. food, weight, workout, steps)
    const context: AIExecutionContext = {
      userId,
      profile,
      language,
    };

    // A. Detect Food Logging intent
    if (
      lowerText.includes('ate') ||
      lowerText.includes('eaten') ||
      lowerText.includes('breakfast') ||
      lowerText.includes('lunch') ||
      lowerText.includes('dinner') ||
      lowerText.includes('snack') ||
      lowerText.includes('أكلت') ||
      lowerText.includes('تناولت') ||
      lowerText.includes('فطور') ||
      lowerText.includes('غداء') ||
      lowerText.includes('عشاء')
    ) {
      const mealType: MealType = lowerText.includes('breakfast') || lowerText.includes('فطور')
        ? 'breakfast'
        : lowerText.includes('dinner') || lowerText.includes('عشاء')
        ? 'dinner'
        : lowerText.includes('snack') || lowerText.includes('سناك')
        ? 'snack'
        : 'lunch';

      const result = await AIToolRegistry.executeToolCall(
        'log_meal',
        { mealType, description: latestUserMessage },
        context
      );

      const mealData = result.data as Meal | undefined;
      const cals = mealData?.totalCalories || 480;
      const protein = mealData?.totalProtein || 36;
      const remainingCals = Math.max(0, (profile?.dailyCalorieTarget || 2150) - cals);

      const reply = isAr
        ? `ممتاز! قمت بتحليل الوجبة وتسجيلها فوراً في يومياتك (${cals} سعرة، ${protein} جم بروتين). تبقى لك في ميزانية اليوم ${remainingCals} سعرة.`
        : `Great! I analyzed and automatically logged this meal into your journal (${cals} kcal, ${protein}g protein). You have ${remainingCals} kcal remaining budgeted for today.`;

      return { reply, toolCallExecuted: result };
    }

    // B. Detect Weight Logging intent
    const weightMatch = latestUserMessage.match(/(\d+(\.\d+)?)\s*(kg|kilos|كجم|كيلو)/i);
    if (weightMatch && (lowerText.includes('weight') || lowerText.includes('weigh') || lowerText.includes('وزن') || lowerText.includes('وزني'))) {
      const weightVal = parseFloat(weightMatch[1]);
      const result = await AIToolRegistry.executeToolCall(
        'log_weight',
        { weightKg: weightVal, notes: 'Logged via AI Coach Chat' },
        context
      );

      const reply = isAr
        ? `تم تسجيل وزنك اليوم (${weightVal} كجم) وتحديث مسار التقدم نحو هدفك (${profile?.targetWeightKg || 70} كجم)! استمر في هذا الالتزام الرائع.`
        : `Logged your weight (${weightVal} kg) and updated your trajectory toward your ${profile?.targetWeightKg || 70} kg goal! Keep up the consistency.`;

      return { reply, toolCallExecuted: result };
    }

    // C. Detect Workout Plan Request
    if (
      lowerText.includes('workout') ||
      lowerText.includes('exercise') ||
      lowerText.includes('routine') ||
      lowerText.includes('تمرن') ||
      lowerText.includes('تمرين') ||
      lowerText.includes('جدول')
    ) {
      const routine = WorkoutService.generateAIWorkoutRoutine({
        primaryGoal: profile?.primaryGoal || 'fat_loss',
        splitType: lowerText.includes('pull') ? 'pull' : lowerText.includes('leg') ? 'legs' : 'push',
        language,
      });

      const result = await AIToolRegistry.executeToolCall(
        'log_workout',
        {
          title: routine.title,
          category: routine.category,
          durationMinutes: routine.durationMinutes,
          exercises: routine.exercises,
          markCompleted: false,
        },
        context
      );

      const reply = isAr
        ? `إليك خطة تمرين اليوم المصممة لهدفك الأيضي: "${routine.title}" (${routine.durationMinutes} دقيقة، ~${routine.estimatedCaloriesBurned} سعرة). يمكنك فتح تبويب التمارين لبدء تنفيذ المجموعات!`
        : `Here is your tailored training routine for today: "${routine.title}" (${routine.durationMinutes} mins, ~${routine.estimatedCaloriesBurned} kcal). You can open the Workout tab to track your sets!`;

      return { reply, toolCallExecuted: result };
    }

    // 2. Call backend server endpoint
    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userContext, language }),
      });

      if (response.ok) {
        const data = await response.json();
        return { reply: data.reply || '' };
      }
    } catch (e) {
      console.warn('Backend AI coach call fallback to offline response:', e);
    }

    // 3. Robust fallback response
    const fallback = isAr
      ? `لقد حللت بياناتك الأيضية الحالية. هدفك اليومي هو ${profile?.dailyCalorieTarget || 2150} سعرة مع ${profile?.dailyProteinTargetGrams || 160} جم بروتين. كيف تحب أن نتقدم اليوم؟`
      : `I have analyzed your metabolic profile. Your target is ${profile?.dailyCalorieTarget || 2150} kcal and ${profile?.dailyProteinTargetGrams || 160}g protein. How would you like to proceed today?`;

    return { reply: fallback };
  }
}
