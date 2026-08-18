import {
  ActivityLog,
  AIChatMessage,
  AIConversation,
  AIConversationMessage,
  DailySummary,
  Goal,
  Meal,
  ProgressStats,
  User,
  UserProfile,
  WeightMeasurement,
  WorkoutSession,
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'ai_fitness_os_current_user',
  PROFILE_PREFIX: 'ai_fitness_os_profile_',
  MEASUREMENTS_PREFIX: 'ai_fitness_os_measurements_',
  MEALS_PREFIX: 'ai_fitness_os_meals_',
  ACTIVITIES_PREFIX: 'ai_fitness_os_activities_',
  WORKOUTS_PREFIX: 'ai_fitness_os_workouts_',
  SUMMARIES_PREFIX: 'ai_fitness_os_summaries_',
  MESSAGES_PREFIX: 'ai_fitness_os_messages_',
  GOALS_PREFIX: 'ai_fitness_os_goals_',
  CONVERSATIONS_PREFIX: 'ai_fitness_os_conversations_',
  CONV_MESSAGES_PREFIX: 'ai_fitness_os_conv_messages_',
};

export class AppStorageRepository {
  // Current authenticated user session
  static getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to save user session', e);
    }
  }

  // Profile operations
  static getProfile(userId: string): UserProfile | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}${userId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.PROFILE_PREFIX}${profile.userId}`,
        JSON.stringify(profile)
      );
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }

  // Measurements
  static getMeasurements(userId: string): WeightMeasurement[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.MEASUREMENTS_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addMeasurement(userId: string, measurement: WeightMeasurement): void {
    const list = this.getMeasurements(userId);
    list.unshift(measurement);
    localStorage.setItem(
      `${STORAGE_KEYS.MEASUREMENTS_PREFIX}${userId}`,
      JSON.stringify(list)
    );
  }

  // Meals
  static getMeals(userId: string): Meal[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.MEALS_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveMeals(userId: string, meals: Meal[]): void {
    localStorage.setItem(
      `${STORAGE_KEYS.MEALS_PREFIX}${userId}`,
      JSON.stringify(meals)
    );
  }

  // Activities
  static getActivities(userId: string): ActivityLog[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.ACTIVITIES_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveActivities(userId: string, activities: ActivityLog[]): void {
    localStorage.setItem(
      `${STORAGE_KEYS.ACTIVITIES_PREFIX}${userId}`,
      JSON.stringify(activities)
    );
  }

  static addActivity(userId: string, activity: ActivityLog): void {
    const activities = this.getActivities(userId);
    activities.unshift(activity);
    this.saveActivities(userId, activities);
  }

  // Workouts
  static getWorkouts(userId: string): WorkoutSession[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.WORKOUTS_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveWorkouts(userId: string, workouts: WorkoutSession[]): void {
    localStorage.setItem(
      `${STORAGE_KEYS.WORKOUTS_PREFIX}${userId}`,
      JSON.stringify(workouts)
    );
  }

  // Daily Summaries
  static getDailySummary(userId: string, dateStr: string): DailySummary | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.SUMMARIES_PREFIX}${userId}_${dateStr}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static saveDailySummary(summary: DailySummary): void {
    localStorage.setItem(
      `${STORAGE_KEYS.SUMMARIES_PREFIX}${summary.userId}_${summary.date}`,
      JSON.stringify(summary)
    );
  }

  // AI Chat Messages
  static getMessages(userId: string): AIChatMessage[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveMessages(userId: string, messages: AIChatMessage[]): void {
    localStorage.setItem(
      `${STORAGE_KEYS.MESSAGES_PREFIX}${userId}`,
      JSON.stringify(messages)
    );
  }

  // Goals
  static getGoals(userId: string): Goal[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.GOALS_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveGoals(userId: string, goals: Goal[]): void {
    localStorage.setItem(
      `${STORAGE_KEYS.GOALS_PREFIX}${userId}`,
      JSON.stringify(goals)
    );
  }

  // Conversations
  static getConversations(userId: string): AIConversation[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.CONVERSATIONS_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveConversations(userId: string, conversations: AIConversation[]): void {
    localStorage.setItem(
      `${STORAGE_KEYS.CONVERSATIONS_PREFIX}${userId}`,
      JSON.stringify(conversations)
    );
  }

  static getConversation(userId: string, convId: string): AIConversation | null {
    const conversations = this.getConversations(userId);
    return conversations.find((c) => c.id === convId) || null;
  }

  static saveConversation(userId: string, conversation: AIConversation): void {
    const conversations = this.getConversations(userId);
    const idx = conversations.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      conversations[idx] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    this.saveConversations(userId, conversations);
  }

  static deleteConversation(userId: string, convId: string): boolean {
    const conversations = this.getConversations(userId);
    const filtered = conversations.filter((c) => c.id !== convId);
    if (filtered.length === conversations.length) return false;
    this.saveConversations(userId, filtered);
    localStorage.removeItem(`${STORAGE_KEYS.CONV_MESSAGES_PREFIX}${convId}`);
    return true;
  }

  // Conversation Messages
  static getConversationMessages(convId: string): AIConversationMessage[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.CONV_MESSAGES_PREFIX}${convId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveConversationMessages(convId: string, messages: AIConversationMessage[]): void {
    localStorage.setItem(
      `${STORAGE_KEYS.CONV_MESSAGES_PREFIX}${convId}`,
      JSON.stringify(messages)
    );
  }

  static addConversationMessage(convId: string, message: AIConversationMessage): void {
    const messages = this.getConversationMessages(convId);
    messages.push(message);
    this.saveConversationMessages(convId, messages);
  }

  // Pending Meals (for meal confirmation review flow)
  static getPendingMeals(userId: string): any[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.MEALS_PREFIX}pending_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static savePendingMeals(userId: string, meals: any[]): void {
    localStorage.setItem(
      `${STORAGE_KEYS.MEALS_PREFIX}pending_${userId}`,
      JSON.stringify(meals)
    );
  }

  // Progress Statistics Calculation
  static getProgressStats(userId: string): ProgressStats {
    const profile = this.getProfile(userId);
    const measurements = this.getMeasurements(userId);
    const meals = this.getMeals(userId);
    const workouts = this.getWorkouts(userId);

    const startWeightKg = measurements.length > 0 ? measurements[measurements.length - 1].weightKg : (profile?.currentWeightKg || 76);
    const currentWeightKg = measurements.length > 0 ? measurements[0].weightKg : (profile?.currentWeightKg || 74);
    const targetWeightKg = profile?.targetWeightKg || 70;

    const totalWeightToLose = Math.abs(startWeightKg - targetWeightKg);
    const weightLostSoFar = Math.abs(startWeightKg - currentWeightKg);
    const progressPercent = totalWeightToLose > 0 ? Math.min(100, Math.round((weightLostSoFar / totalWeightToLose) * 100)) : 50;

    return {
      startWeightKg,
      currentWeightKg,
      targetWeightKg,
      weightChangeKg: Math.round((currentWeightKg - startWeightKg) * 10) / 10,
      progressPercent,
      daysActive: Math.max(1, measurements.length > 0 ? measurements.length : 14),
      loggedMealsCount: meals.length,
      completedWorkoutsCount: workouts.filter(w => w.completed).length || workouts.length,
      adherenceRate: 92,
    };
  }

  // Seeding initial demo account
  static seedDemoUser(lang: 'en' | 'ar' = 'en'): { user: User; profile: UserProfile } {
    const isAr = lang === 'ar';
    const demoUser: User = {
      id: 'demo_user_001',
      email: 'alex.fitness@ai-os.internal',
      displayName: isAr ? 'أحمد كمال' : 'Alex Thorne',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      onboardingCompleted: true,
    };

    const demoProfile: UserProfile = {
      userId: demoUser.id,
      displayName: demoUser.displayName,
      preferredLanguage: lang,
      unitSystem: 'metric',
      currentWeightKg: 74.2,
      heightCm: 178,
      targetWeightKg: 70.0,
      targetDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      primaryGoal: 'fat_loss',
      activityLevel: 'moderately_active',
      trainingFrequency: 4,
      birthYear: 1996,
      gender: 'male',
      notificationPreference: true,
      timezone: 'Europe/London',
      dailyCalorieTarget: 2150,
      dailyProteinTargetGrams: 160,
      dailyCarbsTargetGrams: 210,
      dailyFatTargetGrams: 65,
      dailyStepTarget: 10000,
      dailyWaterTargetMl: 3000,
    };

    this.setCurrentUser(demoUser);
    this.saveProfile(demoProfile);

    // Seed 14 days of realistic weight measurements
    const measurements: WeightMeasurement[] = [];
    const baseWeight = 76.5;
    for (let i = 14; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const randomFluctuation = (Math.sin(i * 0.8) * 0.25);
      const trendLoss = (14 - i) * 0.15;
      const weight = Math.round((baseWeight - trendLoss + randomFluctuation) * 10) / 10;
      measurements.push({
        id: `meas_${i}`,
        userId: demoUser.id,
        weightKg: weight,
        measuredAt: date.toISOString(),
        notes: i === 0 ? (isAr ? 'وزن الصباح على الريق' : 'Morning fasted weigh-in') : undefined,
      });
    }
    localStorage.setItem(
      `${STORAGE_KEYS.MEASUREMENTS_PREFIX}${demoUser.id}`,
      JSON.stringify(measurements)
    );

    // Seed today's meals
    const today = new Date().toISOString().split('T')[0];
    const meals: Meal[] = [
      {
        id: 'meal_1',
        userId: demoUser.id,
        mealType: 'breakfast',
        loggedAt: `${today}T08:30:00Z`,
        items: [
          {
            name: isAr ? 'بيض عيون مع شوفان وتوت' : 'Eggs & Rolled Oats with Berries',
            portion: '1 bowl',
            grams: 320,
            calories: 520,
            protein: 36,
            carbs: 62,
            fat: 14,
            confidence: 0.95,
          },
        ],
        totalCalories: 520,
        totalProtein: 36,
        totalCarbs: 62,
        totalFat: 14,
        aiAnalyzed: true,
        userConfirmed: true,
      },
      {
        id: 'meal_2',
        userId: demoUser.id,
        mealType: 'lunch',
        loggedAt: `${today}T13:15:00Z`,
        items: [
          {
            name: isAr ? 'صدر دجاج مشوي مع أرز بسمتي وخضار' : 'Grilled Chicken Breast with Jasmine Rice & Broccoli',
            portion: '350g plate',
            grams: 350,
            calories: 680,
            protein: 58,
            carbs: 74,
            fat: 16,
            confidence: 0.92,
          },
        ],
        totalCalories: 680,
        totalProtein: 58,
        totalCarbs: 74,
        totalFat: 16,
        aiAnalyzed: true,
        userConfirmed: true,
      },
    ];
    this.saveMeals(demoUser.id, meals);

    // Seed today's summary
    const dailySummary: DailySummary = {
      id: `sum_${today}`,
      userId: demoUser.id,
      date: today,
      caloriesConsumed: 1200,
      caloriesTarget: 2150,
      proteinConsumedGrams: 94,
      proteinTargetGrams: 160,
      carbsConsumedGrams: 136,
      fatConsumedGrams: 30,
      steps: 7420,
      stepTarget: 10000,
      activeMinutes: 42,
      activeCalories: 380,
      waterMl: 2100,
      sleepHours: 7.8,
      readinessScore: 88,
      weightKg: 74.2,
      workoutCompleted: false,
    };
    this.saveDailySummary(dailySummary);

    // Seed sample workout
    const workout: WorkoutSession = {
      id: 'workout_today',
      userId: demoUser.id,
      title: isAr ? 'صدر وترايسبس (دفع وقوة)' : 'Upper Body Hypertrophy (Push Focus)',
      category: 'Push',
      durationMinutes: 50,
      completed: false,
      exercises: [
        {
          id: 'ex_1',
          name: isAr ? 'ضغط الصدر بالبار المستوي (Barbell Bench Press)' : 'Flat Barbell Bench Press',
          category: 'chest',
          targetSets: 4,
          targetReps: 8,
          restSeconds: 90,
          sets: [
            { setNumber: 1, reps: 8, weightKg: 80, completed: true },
            { setNumber: 2, reps: 8, weightKg: 80, completed: true },
            { setNumber: 3, reps: 8, weightKg: 82.5, completed: false },
            { setNumber: 4, reps: 8, weightKg: 82.5, completed: false },
          ],
        },
        {
          id: 'ex_2',
          name: isAr ? 'تجميع دمبل على بنش مائل (Incline DB Press)' : 'Incline Dumbbell Press',
          category: 'chest',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 75,
          sets: [
            { setNumber: 1, reps: 10, weightKg: 28, completed: false },
            { setNumber: 2, reps: 10, weightKg: 28, completed: false },
            { setNumber: 3, reps: 10, weightKg: 28, completed: false },
          ],
        },
        {
          id: 'ex_3',
          name: isAr ? 'سحب كيبل ترايسبس بالحبل (Triceps Rope Pushdown)' : 'Triceps Cable Rope Pushdown',
          category: 'arms',
          targetSets: 3,
          targetReps: 12,
          restSeconds: 60,
          sets: [
            { setNumber: 1, reps: 12, weightKg: 25, completed: false },
            { setNumber: 2, reps: 12, weightKg: 25, completed: false },
            { setNumber: 3, reps: 12, weightKg: 25, completed: false },
          ],
        },
      ],
    };
    this.saveWorkouts(demoUser.id, [workout]);

    return { user: demoUser, profile: demoProfile };
  }
}
