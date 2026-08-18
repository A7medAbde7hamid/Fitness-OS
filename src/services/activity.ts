import { AppStorageRepository } from '../db/storage';
import { ActivityLog } from '../types';

export type ActivityType = 'steps' | 'walking' | 'running' | 'cycling' | 'swimming' | 'hiit' | 'other';
export type ActivityIntensity = 'low' | 'moderate' | 'high' | 'very_high';

export interface LogActivityParams {
  userId: string;
  activityType: ActivityType;
  durationMinutes: number;
  distanceKm?: number;
  caloriesBurned?: number;
  steps?: number;
  intensity?: ActivityIntensity;
  heartRateAvg?: number;
  heartRateMax?: number;
  source?: 'manual' | 'apple_health' | 'google_fit' | 'pedometer';
  deviceModel?: string;
  notes?: string;
  loggedAt?: string;
}

export interface ActivityStats {
  totalDurationMinutes: number;
  totalDistanceKm: number;
  totalCalories: number;
  totalSteps: number;
  activityCount: number;
  byType: Record<string, { count: number; duration: number; calories: number }>;
}

/**
 * Activity Service
 * Manages logging, retrieval, metabolic calorie estimation, and multi-device telemetry synchronization
 */
export class ActivityService {
  // MET (Metabolic Equivalent of Task) values for estimation
  private static readonly MET_MAP: Record<ActivityType, Record<ActivityIntensity, number>> = {
    walking: { low: 2.8, moderate: 3.5, high: 4.5, very_high: 5.0 },
    running: { low: 7.0, moderate: 9.8, high: 11.5, very_high: 13.5 },
    cycling: { low: 4.0, moderate: 6.8, high: 8.5, very_high: 12.0 },
    swimming: { low: 5.0, moderate: 7.0, high: 9.5, very_high: 11.0 },
    hiit: { low: 6.0, moderate: 8.0, high: 10.0, very_high: 12.5 },
    steps: { low: 2.5, moderate: 3.3, high: 4.0, very_high: 4.5 },
    other: { low: 3.5, moderate: 5.0, high: 7.0, very_high: 9.0 },
  };

  /**
   * Estimate calories burned using MET formula: Calories = MET * Weight(kg) * Time(hours)
   */
  static estimateCalories(
    activityType: ActivityType,
    durationMinutes: number,
    intensity: ActivityIntensity = 'moderate',
    weightKg: number = 74
  ): number {
    const met = this.MET_MAP[activityType]?.[intensity] || 5.0;
    const hours = durationMinutes / 60;
    return Math.round(met * weightKg * hours);
  }

  /**
   * Log an activity and automatically update daily summary
   */
  static async logActivity(params: LogActivityParams): Promise<ActivityLog> {
    const {
      userId,
      activityType,
      durationMinutes,
      distanceKm,
      intensity = 'moderate',
      source = 'manual',
      loggedAt = new Date().toISOString(),
    } = params;

    const profile = AppStorageRepository.getProfile(userId);
    const weightKg = profile?.currentWeightKg || 74;

    // Calculate or use supplied calories
    const caloriesBurned =
      params.caloriesBurned && params.caloriesBurned > 0
        ? params.caloriesBurned
        : this.estimateCalories(activityType, durationMinutes, intensity, weightKg);

    // Estimate steps for walking/running if not given
    let steps = params.steps || 0;
    if (!steps && (activityType === 'walking' || activityType === 'running')) {
      if (distanceKm && distanceKm > 0) {
        steps = Math.round(distanceKm * 1350);
      } else {
        steps = Math.round(durationMinutes * (activityType === 'running' ? 150 : 100));
      }
    }

    const activity: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      activityType,
      durationMinutes,
      distanceKm,
      caloriesBurned,
      steps,
      source,
      loggedAt,
    };

    // Store in persistence
    AppStorageRepository.addActivity(userId, activity);

    // Update today's daily summary active minutes, active calories, and steps
    const dateStr = loggedAt.split('T')[0];
    let summary = AppStorageRepository.getDailySummary(userId, dateStr);
    if (!summary) {
      summary = {
        id: `sum_${dateStr}_${userId}`,
        userId,
        date: dateStr,
        caloriesConsumed: 0,
        caloriesTarget: profile?.dailyCalorieTarget || 2150,
        proteinConsumedGrams: 0,
        proteinTargetGrams: profile?.dailyProteinTargetGrams || 160,
        carbsConsumedGrams: 0,
        fatConsumedGrams: 0,
        steps,
        stepTarget: profile?.dailyStepTarget || 10000,
        activeMinutes: durationMinutes,
        activeCalories: caloriesBurned,
        waterMl: 0,
        readinessScore: 88,
        workoutCompleted: false,
      };
    } else {
      summary.activeMinutes = (summary.activeMinutes || 0) + durationMinutes;
      summary.activeCalories = (summary.activeCalories || 0) + caloriesBurned;
      summary.steps = (summary.steps || 0) + steps;
    }

    AppStorageRepository.saveDailySummary(summary);

    return activity;
  }

  /**
   * Retrieve user activities with optional filters
   */
  static getActivities(userId: string, filterType?: ActivityType): ActivityLog[] {
    const all = AppStorageRepository.getActivities(userId);
    if (filterType) {
      return all.filter((a) => a.activityType === filterType);
    }
    return all;
  }

  /**
   * Compute aggregated statistics for user activities
   */
  static getActivityStats(userId: string, days: number = 7): ActivityStats {
    const activities = this.getActivities(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recent = activities.filter((a) => new Date(a.loggedAt) >= cutoffDate);

    let totalDurationMinutes = 0;
    let totalDistanceKm = 0;
    let totalCalories = 0;
    let totalSteps = 0;
    const byType: Record<string, { count: number; duration: number; calories: number }> = {};

    for (const a of recent) {
      totalDurationMinutes += a.durationMinutes;
      totalDistanceKm += a.distanceKm || 0;
      totalCalories += a.caloriesBurned;
      totalSteps += a.steps || 0;

      if (!byType[a.activityType]) {
        byType[a.activityType] = { count: 0, duration: 0, calories: 0 };
      }
      byType[a.activityType].count += 1;
      byType[a.activityType].duration += a.durationMinutes;
      byType[a.activityType].calories += a.caloriesBurned;
    }

    return {
      totalDurationMinutes,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalCalories,
      totalSteps,
      activityCount: recent.length,
      byType,
    };
  }
}
