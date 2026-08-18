import {
  PrimaryGoal,
  WorkoutExercise,
  WorkoutExerciseSet,
  WorkoutSession,
} from '../types';
import { AppStorageRepository } from '../db/storage';
import { ActivityService } from './activity';

export interface ExerciseDefinition {
  id: string;
  name: string;
  nameAr: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full_body';
  primaryMuscle: string;
  primaryMuscleAr: string;
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell';
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
  metValue: number; // Metabolic Equivalent of Task
  instructions?: string;
  instructionsAr?: string;
}

export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  // CHEST
  {
    id: 'flat_barbell_bench_press',
    name: 'Flat Barbell Bench Press',
    nameAr: 'ضغط الصدر بالبار المستوي',
    category: 'chest',
    primaryMuscle: 'Pectoralis Major',
    primaryMuscleAr: 'عضلة الصدر الكبرى',
    equipment: 'barbell',
    defaultSets: 4,
    defaultReps: 8,
    defaultRestSeconds: 90,
    metValue: 6.0,
    instructions: 'Lower the bar with control to mid-chest, drive up with feet planted firmly.',
    instructionsAr: 'أنزل البار بتحكم إلى منتصف الصدر ثم ارفع للأعلى مع ثبات القدمين.',
  },
  {
    id: 'incline_dumbbell_press',
    name: 'Incline Dumbbell Press',
    nameAr: 'ضغط دمبل على بنش مائل',
    category: 'chest',
    primaryMuscle: 'Clavicular Head (Upper Chest)',
    primaryMuscleAr: 'الصدر العلوي',
    equipment: 'dumbbell',
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSeconds: 75,
    metValue: 5.5,
    instructions: 'Set bench at 30-45 degrees, press vertically without clanking dumbbells.',
    instructionsAr: 'اضبط المقعد بزاوية 30-45 درجة واضغط للأعلى بثبات.',
  },
  {
    id: 'cable_chest_fly',
    name: 'Cable Chest Fly',
    nameAr: 'تجميع الصدر بالكيبل',
    category: 'chest',
    primaryMuscle: 'Pectoralis Major',
    primaryMuscleAr: 'عضلة الصدر',
    equipment: 'cable',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSeconds: 60,
    metValue: 4.5,
  },

  // BACK
  {
    id: 'barbell_deadlift',
    name: 'Conventional Barbell Deadlift',
    nameAr: 'رفعة ميتة بالبار (ديدلفت)',
    category: 'back',
    primaryMuscle: 'Posterior Chain & Erector Spinae',
    primaryMuscleAr: 'عضلات الظهر السفلية والعمود الفقري',
    equipment: 'barbell',
    defaultSets: 4,
    defaultReps: 6,
    defaultRestSeconds: 120,
    metValue: 7.5,
  },
  {
    id: 'lat_pulldown',
    name: 'Wide-Grip Lat Pulldown',
    nameAr: 'سحب ظهر عريض بالجهاز',
    category: 'back',
    primaryMuscle: 'Latissimus Dorsi',
    primaryMuscleAr: 'عضلات الظهر العريضة (المجنص)',
    equipment: 'cable',
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSeconds: 75,
    metValue: 5.0,
  },
  {
    id: 'chest_supported_row',
    name: 'Chest-Supported Dumbbell Row',
    nameAr: 'سحب دمبل على مقعد مائل مدعوم',
    category: 'back',
    primaryMuscle: 'Rhomboids & Mid Traps',
    primaryMuscleAr: 'منتصف الظهر والترابيس',
    equipment: 'dumbbell',
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSeconds: 75,
    metValue: 5.0,
  },

  // LEGS
  {
    id: 'barbell_back_squat',
    name: 'Barbell Back Squat',
    nameAr: 'سكوات بالبار الخلفي',
    category: 'legs',
    primaryMuscle: 'Quadriceps & Glutes',
    primaryMuscleAr: 'عضلات الفخذ الأمامية والمؤخرة',
    equipment: 'barbell',
    defaultSets: 4,
    defaultReps: 8,
    defaultRestSeconds: 120,
    metValue: 7.0,
  },
  {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift (RDL)',
    nameAr: 'ديدلفت روماني لعضلات الفخذ الخلفية',
    category: 'legs',
    primaryMuscle: 'Hamstrings & Glutes',
    primaryMuscleAr: 'الفخذ الخلفي والألوية',
    equipment: 'barbell',
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSeconds: 90,
    metValue: 6.0,
  },
  {
    id: 'leg_press',
    name: 'Incline Leg Press',
    nameAr: 'دفع رجلين بالجهاز المائل',
    category: 'legs',
    primaryMuscle: 'Quadriceps',
    primaryMuscleAr: 'الفخذ الأمامي',
    equipment: 'machine',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSeconds: 90,
    metValue: 5.5,
  },

  // SHOULDERS
  {
    id: 'overhead_dumbbell_press',
    name: 'Seated Dumbbell Shoulder Press',
    nameAr: 'ضغط أكتاف بالدمبل جالساً',
    category: 'shoulders',
    primaryMuscle: 'Anterior Deltoids',
    primaryMuscleAr: 'الكتف الأمامي والجانبي',
    equipment: 'dumbbell',
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSeconds: 75,
    metValue: 5.0,
  },
  {
    id: 'dumbbell_lateral_raise',
    name: 'Standing Dumbbell Lateral Raise',
    nameAr: 'رفرفة جانبي بالدمبل',
    category: 'shoulders',
    primaryMuscle: 'Lateral Deltoids',
    primaryMuscleAr: 'الكتف الجانبي',
    equipment: 'dumbbell',
    defaultSets: 4,
    defaultReps: 15,
    defaultRestSeconds: 60,
    metValue: 4.0,
  },

  // ARMS
  {
    id: 'triceps_rope_pushdown',
    name: 'Triceps Cable Rope Pushdown',
    nameAr: 'سحب كيبل ترايسبس بالحبل',
    category: 'arms',
    primaryMuscle: 'Triceps Brachii',
    primaryMuscleAr: 'عضلة الترايسبس',
    equipment: 'cable',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSeconds: 60,
    metValue: 4.5,
  },
  {
    id: 'biceps_incline_db_curl',
    name: 'Incline Dumbbell Biceps Curl',
    nameAr: 'تبادل بايسبس دمبل على بنش مائل',
    category: 'arms',
    primaryMuscle: 'Biceps Brachii',
    primaryMuscleAr: 'عضلة البايسبس',
    equipment: 'dumbbell',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSeconds: 60,
    metValue: 4.5,
  },

  // CORE
  {
    id: 'hanging_leg_raise',
    name: 'Hanging Leg Raise',
    nameAr: 'رفع الأرجل معلقاً لعضلات البطن',
    category: 'core',
    primaryMuscle: 'Rectus Abdominis & Hip Flexors',
    primaryMuscleAr: 'عضلات البطن السفلية',
    equipment: 'bodyweight',
    defaultSets: 3,
    defaultReps: 15,
    defaultRestSeconds: 60,
    metValue: 4.0,
  },
];

export class WorkoutService {
  /**
   * Fetch all user workouts
   */
  static getWorkoutHistory(userId: string): WorkoutSession[] {
    return AppStorageRepository.getWorkouts(userId);
  }

  /**
   * Create a new workout session from structured exercises
   */
  static createWorkoutSession(
    userId: string,
    payload: {
      title: string;
      category: string;
      durationMinutes?: number;
      exercises: Array<{
        name: string;
        category: WorkoutExercise['category'];
        targetSets: number;
        targetReps: number;
        restSeconds: number;
        defaultWeightKg?: number;
      }>;
      notes?: string;
    }
  ): WorkoutSession {
    const formattedExercises: WorkoutExercise[] = payload.exercises.map((ex, idx) => {
      const sets: WorkoutExerciseSet[] = [];
      for (let s = 1; s <= ex.targetSets; s++) {
        sets.push({
          setNumber: s,
          reps: ex.targetReps,
          weightKg: ex.defaultWeightKg || 20,
          completed: false,
        });
      }

      return {
        id: `ex_${Date.now()}_${idx}`,
        name: ex.name,
        category: ex.category,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        restSeconds: ex.restSeconds,
        sets,
      };
    });

    const session: WorkoutSession = {
      id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      title: payload.title,
      category: payload.category,
      durationMinutes: payload.durationMinutes || 45,
      exercises: formattedExercises,
      completed: false,
      startedAt: new Date().toISOString(),
      notes: payload.notes,
    };

    const existing = AppStorageRepository.getWorkouts(userId);
    AppStorageRepository.saveWorkouts(userId, [session, ...existing]);
    return session;
  }

  /**
   * Log set completion for a specific exercise within a session
   */
  static logExerciseSet(
    userId: string,
    workoutId: string,
    exerciseId: string,
    setNumber: number,
    update: { reps?: number; weightKg?: number; completed: boolean }
  ): WorkoutSession | null {
    const workouts = AppStorageRepository.getWorkouts(userId);
    const workout = workouts.find((w) => w.id === workoutId);
    if (!workout) return null;

    const exercise = workout.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return null;

    let targetSet = exercise.sets.find((s) => s.setNumber === setNumber);
    if (!targetSet) {
      targetSet = {
        setNumber,
        reps: update.reps || exercise.targetReps,
        weightKg: update.weightKg || 20,
        completed: update.completed,
      };
      exercise.sets.push(targetSet);
    } else {
      if (update.reps !== undefined) targetSet.reps = update.reps;
      if (update.weightKg !== undefined) targetSet.weightKg = update.weightKg;
      targetSet.completed = update.completed;
    }

    AppStorageRepository.saveWorkouts(userId, workouts);
    return workout;
  }

  /**
   * Complete a workout session and synchronize metabolic energy burn
   */
  static completeWorkout(
    userId: string,
    workoutId: string,
    completionData?: {
      actualDurationMinutes?: number;
      rpeScore?: number; // Rate of perceived exertion 1-10
      notes?: string;
    }
  ): WorkoutSession | null {
    const workouts = AppStorageRepository.getWorkouts(userId);
    const workoutIndex = workouts.findIndex((w) => w.id === workoutId);
    if (workoutIndex === -1) return null;

    const workout = workouts[workoutIndex];
    const profile = AppStorageRepository.getProfile(userId);
    const userWeightKg = profile?.currentWeightKg || 74;

    const duration = completionData?.actualDurationMinutes || workout.durationMinutes || 45;
    // Strength training average MET is ~5.5 to 6.5
    const caloriesBurned = ActivityService.estimateCalories(
      'hiit',
      duration,
      'moderate',
      userWeightKg
    );

    workout.completed = true;
    workout.completedAt = new Date().toISOString();
    workout.durationMinutes = duration;
    workout.caloriesBurned = caloriesBurned;
    if (completionData?.notes) workout.notes = completionData.notes;

    workouts[workoutIndex] = workout;
    AppStorageRepository.saveWorkouts(userId, workouts);

    // Update Daily Summary
    const today = new Date().toISOString().split('T')[0];
    const summary = AppStorageRepository.getDailySummary(userId, today);
    if (summary) {
      summary.workoutCompleted = true;
      summary.activeCalories += caloriesBurned;
      summary.activeMinutes += duration;
      AppStorageRepository.saveDailySummary(summary);
    }

    return workout;
  }

  /**
   * Calculate total tonnage / volume lifted in a session
   */
  static calculateWorkoutVolume(session: WorkoutSession): {
    totalVolumeKg: number;
    completedSets: number;
    totalSets: number;
    completionPercentage: number;
  } {
    let totalVolumeKg = 0;
    let completedSets = 0;
    let totalSets = 0;

    for (const ex of session.exercises) {
      for (const s of ex.sets) {
        totalSets++;
        if (s.completed) {
          completedSets++;
          totalVolumeKg += s.reps * (s.weightKg || 0);
        }
      }
    }

    const completionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    return {
      totalVolumeKg,
      completedSets,
      totalSets,
      completionPercentage,
    };
  }

  /**
   * AI Coach Workout Generator Engine
   * Dynamically constructs tailored workout sessions ready for AI proposal or execution
   */
  static generateAIWorkoutRoutine(params: {
    primaryGoal?: PrimaryGoal;
    splitType?: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body';
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    durationMinutes?: number;
    language?: 'en' | 'ar';
  }): {
    title: string;
    category: string;
    durationMinutes: number;
    estimatedCaloriesBurned: number;
    exercises: Array<{
      name: string;
      category: WorkoutExercise['category'];
      targetSets: number;
      targetReps: number;
      restSeconds: number;
      defaultWeightKg: number;
      instructions?: string;
    }>;
  } {
    const isAr = params.language === 'ar';
    const split = params.splitType || 'push';

    if (split === 'push') {
      return {
        title: isAr ? 'جلسة دفع علوي (صدر وأكتاف وترايسبس)' : 'Upper Body Push Power & Hypertrophy',
        category: 'Push',
        durationMinutes: params.durationMinutes || 45,
        estimatedCaloriesBurned: 380,
        exercises: [
          {
            name: isAr ? 'ضغط الصدر بالبار المستوي' : 'Flat Barbell Bench Press',
            category: 'chest',
            targetSets: 4,
            targetReps: 8,
            restSeconds: 90,
            defaultWeightKg: 75,
            instructions: isAr ? 'تحكم في النزول واضغط بقوة للأعلى.' : 'Controlled eccentric tempo.',
          },
          {
            name: isAr ? 'ضغط دمبل على بنش مائل' : 'Incline Dumbbell Press',
            category: 'chest',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 75,
            defaultWeightKg: 26,
          },
          {
            name: isAr ? 'ضغط أكتاف بالدمبل جالساً' : 'Seated Dumbbell Shoulder Press',
            category: 'shoulders',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 75,
            defaultWeightKg: 20,
          },
          {
            name: isAr ? 'رفرفة جانبي بالدمبل' : 'Standing Dumbbell Lateral Raise',
            category: 'shoulders',
            targetSets: 4,
            targetReps: 15,
            restSeconds: 60,
            defaultWeightKg: 10,
          },
          {
            name: isAr ? 'سحب كيبل ترايسبس بالحبل' : 'Triceps Cable Rope Pushdown',
            category: 'arms',
            targetSets: 3,
            targetReps: 12,
            restSeconds: 60,
            defaultWeightKg: 25,
          },
        ],
      };
    }

    if (split === 'pull') {
      return {
        title: isAr ? 'جلسة سحب علوي (ظهر وبايسبس)' : 'Upper Body Pull & Posterior Chain',
        category: 'Pull',
        durationMinutes: params.durationMinutes || 45,
        estimatedCaloriesBurned: 400,
        exercises: [
          {
            name: isAr ? 'سحب ظهر عريض بالجهاز' : 'Wide-Grip Lat Pulldown',
            category: 'back',
            targetSets: 4,
            targetReps: 10,
            restSeconds: 75,
            defaultWeightKg: 65,
          },
          {
            name: isAr ? 'سحب دمبل على مقعد مائل مدعوم' : 'Chest-Supported Dumbbell Row',
            category: 'back',
            targetSets: 4,
            targetReps: 10,
            restSeconds: 75,
            defaultWeightKg: 24,
          },
          {
            name: isAr ? 'تبادل بايسبس دمبل على بنش مائل' : 'Incline Dumbbell Biceps Curl',
            category: 'arms',
            targetSets: 3,
            targetReps: 12,
            restSeconds: 60,
            defaultWeightKg: 14,
          },
          {
            name: isAr ? 'رفع الأرجل معلقاً للبطن' : 'Hanging Leg Raise',
            category: 'core',
            targetSets: 3,
            targetReps: 15,
            restSeconds: 60,
            defaultWeightKg: 0,
          },
        ],
      };
    }

    // Default Legs / Lower Body
    return {
      title: isAr ? 'جلسة أرجل قوية وشاملة' : 'Lower Body Strength & Hypertrophy',
      category: 'Legs',
      durationMinutes: params.durationMinutes || 50,
      estimatedCaloriesBurned: 450,
      exercises: [
        {
          name: isAr ? 'سكوات بالبار الخلفي' : 'Barbell Back Squat',
          category: 'legs',
          targetSets: 4,
          targetReps: 8,
          restSeconds: 120,
          defaultWeightKg: 90,
        },
        {
          name: isAr ? 'ديدلفت روماني لعضلات الفخذ الخلفية' : 'Romanian Deadlift (RDL)',
          category: 'legs',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          defaultWeightKg: 80,
        },
        {
          name: isAr ? 'دفع رجلين بالجهاز المائل' : 'Incline Leg Press',
          category: 'legs',
          targetSets: 3,
          targetReps: 12,
          restSeconds: 90,
          defaultWeightKg: 140,
        },
      ],
    };
  }
}
