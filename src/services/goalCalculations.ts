import { AppStorageRepository } from '../db/storage';
import { Goal, WeightMeasurement } from '../types';

export interface GoalProgress {
  goalId: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  remainingValue: number;
  progressPercent: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  dailyRateOfChange: number;
  estimatedDaysToComplete: number | null;
  estimatedCompletionDate: string | null;
  isOnTrack: boolean;
  trendDirection: 'gaining' | 'losing' | 'maintaining' | 'unknown';
  weeklyWeightChanges: number[];
  rolling7DayAvg: number | null;
  safetyWarnings: string[];
}

export interface WeightTrendDataPoint {
  date: string;
  weight: number;
  rollingAvg: number | null;
}

export class GoalCalculationsService {
  static calculateGoalProgress(
    goal: Goal,
    measurements: WeightMeasurement[]
  ): GoalProgress {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetDate);

    const daysElapsed = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / 86400000));
    const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / 86400000));
    const totalDays = Math.max(1, Math.floor((targetDate.getTime() - startDate.getTime()) / 86400000));

    const remainingValue = Math.abs(goal.currentValue - goal.targetValue);
    const totalChange = Math.abs(goal.startValue - goal.targetValue);
    const progressPercent = totalChange > 0
      ? Math.min(100, Math.round(((totalChange - remainingValue) / totalChange) * 100))
      : 0;

    const dailyRateOfChange = daysElapsed > 0
      ? (goal.currentValue - goal.startValue) / daysElapsed
      : 0;

    let estimatedDaysToComplete: number | null = null;
    let estimatedCompletionDate: string | null = null;
    if (Math.abs(dailyRateOfChange) > 0.001 && remainingValue > 0) {
      const direction = goal.targetValue < goal.startValue ? -1 : 1;
      const dailyRate = dailyRateOfChange * direction;
      if (dailyRate > 0) {
        estimatedDaysToComplete = Math.ceil(remainingValue / dailyRate);
        const estDate = new Date(now);
        estDate.setDate(estDate.getDate() + estimatedDaysToComplete);
        estimatedCompletionDate = estDate.toISOString().split('T')[0];
      }
    }

    const isOnTrack = estimatedDaysToComplete !== null
      ? estimatedDaysToComplete <= daysRemaining
      : true;

    const weeklyChanges: number[] = [];
    for (let i = 0; i < Math.min(measurements.length - 1, 28); i++) {
      if (i + 1 < measurements.length) {
        weeklyChanges.push(
          Math.round((measurements[i].weightKg - measurements[i + 1].weightKg) * 100) / 100
        );
      }
    }

    let trendDirection: GoalProgress['trendDirection'] = 'unknown';
    if (weeklyChanges.length >= 3) {
      const avgChange = weeklyChanges.slice(0, 7).reduce((a, b) => a + b, 0) / Math.min(weeklyChanges.length, 7);
      if (avgChange < -0.05) trendDirection = 'losing';
      else if (avgChange > 0.05) trendDirection = 'gaining';
      else trendDirection = 'maintaining';
    }

    let rolling7DayAvg: number | null = null;
    if (measurements.length >= 7) {
      const last7 = measurements.slice(0, 7);
      rolling7DayAvg = Math.round(
        (last7.reduce((sum, m) => sum + m.weightKg, 0) / 7) * 10
      ) / 10;
    }

    const safetyWarnings = this.calculateSafetyWarnings(
      goal,
      measurements,
      dailyRateOfChange,
      daysElapsed
    );

    return {
      goalId: goal.id,
      startValue: goal.startValue,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      remainingValue,
      progressPercent,
      daysElapsed,
      daysRemaining,
      totalDays,
      dailyRateOfChange: Math.round(dailyRateOfChange * 1000) / 1000,
      estimatedDaysToComplete,
      estimatedCompletionDate,
      isOnTrack,
      trendDirection,
      weeklyWeightChanges: weeklyChanges.slice(0, 28),
      rolling7DayAvg,
      safetyWarnings,
    };
  }

  static calculateSafetyWarnings(
    goal: Goal,
    measurements: WeightMeasurement[],
    dailyRate: number,
    daysElapsed: number
  ): string[] {
    const warnings: string[] = [];
    const weeklyRate = dailyRate * 7;

    if (goal.category === 'weight') {
      if (goal.targetValue < goal.startValue) {
        if (weeklyRate < -1.0) {
          warnings.push('WEIGHT_LOSS_TOO_FAST');
        }
        if (weeklyRate < -0.5 && daysElapsed > 14) {
          warnings.push('SUSTAINED_FAST_LOSS');
        }
      } else if (goal.targetValue > goal.startValue) {
        if (weeklyRate > 0.75) {
          warnings.push('WEIGHT_GAIN_TOO_FAST');
        }
      }

      const latestWeight = measurements.length > 0 ? measurements[0].weightKg : goal.currentValue;
      if (latestWeight < 45 || latestWeight > 200) {
        warnings.push('EXTREME_WEIGHT');
      }
    }

    if (daysElapsed > 7 && measurements.length > 0) {
      const lastWeek = measurements.slice(0, 7);
      const weights = lastWeek.map((m) => m.weightKg);
      const max = Math.max(...weights);
      const min = Math.min(...weights);
      if (max - min > 3) {
        warnings.push('HIGH_WEIGHT_VARIABILITY');
      }
    }

    return warnings;
  }

  static getWeightTrendData(
    measurements: WeightMeasurement[],
    days: number = 90
  ): WeightTrendDataPoint[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const filtered = measurements
      .filter((m) => new Date(m.measuredAt) >= cutoff)
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

    const result: WeightTrendDataPoint[] = [];
    const windowSize = 7;

    for (let i = 0; i < filtered.length; i++) {
      let rollingAvg: number | null = null;
      if (i >= windowSize - 1) {
        const window = filtered.slice(i - windowSize + 1, i + 1);
        rollingAvg = Math.round(
          (window.reduce((sum, m) => sum + m.weightKg, 0) / windowSize) * 10
        ) / 10;
      }

      result.push({
        date: filtered[i].measuredAt.split('T')[0],
        weight: filtered[i].weightKg,
        rollingAvg,
      });
    }

    return result;
  }

  static getGoalSummaryForDashboard(userId: string): {
    hasGoal: boolean;
    goalTitle: string | null;
    progressPercent: number;
    daysRemaining: number;
    dailyRate: number;
    isOnTrack: boolean;
    safetyWarning: string | null;
  } {
    const goals = AppStorageRepository.getGoals(userId);
    const activeGoal = goals.find((g) => g.status === 'in_progress');

    if (!activeGoal) {
      return {
        hasGoal: false,
        goalTitle: null,
        progressPercent: 0,
        daysRemaining: 0,
        dailyRate: 0,
        isOnTrack: true,
        safetyWarning: null,
      };
    }

    const measurements = AppStorageRepository.getMeasurements(userId);
    const progress = this.calculateGoalProgress(activeGoal, measurements);

    return {
      hasGoal: true,
      goalTitle: activeGoal.title,
      progressPercent: progress.progressPercent,
      daysRemaining: progress.daysRemaining,
      dailyRate: progress.dailyRateOfChange,
      isOnTrack: progress.isOnTrack,
      safetyWarning: progress.safetyWarnings.length > 0 ? progress.safetyWarnings[0] : null,
    };
  }
}
