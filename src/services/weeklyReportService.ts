import { WeeklyReportData, WeightMeasurement, Meal, ActivityLog, WorkoutSession, DailySummary } from '../types';
import { AppStorageRepository } from '../db/storage';
import { IndexedDBRepository } from '../db/indexedDb';

function generateId(): string {
  return `wr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getWeekRange(offset: number = 0): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek - 7 * offset);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0],
  };
}

function filterByDateRange<T>(items: T[], start: string, end: string, dateField: (item: T) => string | undefined): T[] {
  return items.filter((item) => {
    const dateStr = dateField(item) || '';
    const date = dateStr.split('T')[0];
    return date >= start && date <= end;
  });
}

export class WeeklyReportService {
  static async generate(userId: string, weekOffset: number = 0): Promise<WeeklyReportData> {
    const { start, end } = getWeekRange(weekOffset);

    const measurements = AppStorageRepository.getMeasurements(userId);
    const meals = AppStorageRepository.getMeals(userId);
    const activities = AppStorageRepository.getActivities(userId);
    const workouts = AppStorageRepository.getWorkouts(userId);
    const checkIns = await IndexedDBRepository.getCheckIns(userId);

    const weekMeasurements = filterByDateRange(measurements, start, end, (m) => m.measuredAt);
    const weekMeals = filterByDateRange(meals, start, end, (m) => m.loggedAt);
    const weekActivities = filterByDateRange(activities, start, end, (a) => a.loggedAt);
    const weekWorkouts = filterByDateRange(workouts, start, end, (w) => w.startedAt);
    const weekCheckIns = checkIns.filter((c) => c.date >= start && c.date <= end);

    // Weight analysis
    const weights = weekMeasurements.map((m) => m.weightKg).sort((a, b) => a - b);
    const startWeight = weekMeasurements.length > 0 ? weekMeasurements[weekMeasurements.length - 1].weightKg : 0;
    const endWeight = weekMeasurements.length > 0 ? weekMeasurements[0].weightKg : 0;
    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
    const deltaKg = endWeight - startWeight;
    const trend: 'losing' | 'maintaining' | 'gaining' =
      deltaKg < -0.2 ? 'losing' : deltaKg > 0.2 ? 'gaining' : 'maintaining';

    const dailyWeights = weekMeasurements.map((m) => ({
      date: m.measuredAt.split('T')[0],
      weightKg: m.weightKg,
    }));

    // Nutrition analysis
    const totalCalories = weekMeals.reduce((sum, m) => sum + m.totalCalories, 0);
    const totalProtein = weekMeals.reduce((sum, m) => sum + m.totalProtein, 0);
    const totalCarbs = weekMeals.reduce((sum, m) => sum + m.totalCarbs, 0);
    const totalFat = weekMeals.reduce((sum, m) => sum + m.totalFat, 0);
    const daysWithMeals = new Set(weekMeals.map((m) => m.loggedAt.split('T')[0])).size;

    // Activity analysis
    const totalSteps = weekActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
    const totalActiveMinutes = weekActivities.reduce((sum, a) => sum + a.durationMinutes, 0);
    const daysActive = new Set(weekActivities.map((a) => a.loggedAt.split('T')[0])).size;

    // Workout analysis
    const completedWorkouts = weekWorkouts.filter((w) => w.completed);
    const totalWorkoutDuration = completedWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
    const categories: Record<string, number> = {};
    completedWorkouts.forEach((w) => {
      categories[w.category] = (categories[w.category] || 0) + 1;
    });

    const report: WeeklyReportData = {
      userId,
      startDate: start,
      endDate: end,
      weight: {
        startKg: startWeight,
        endKg: endWeight,
        deltaKg: Math.round(deltaKg * 10) / 10,
        avgKg: Math.round(avgWeight * 10) / 10,
        trend,
        dailyWeights,
      },
      nutrition: {
        avgDailyCalories: daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0,
        avgDailyProtein: daysWithMeals > 0 ? Math.round(totalProtein / daysWithMeals) : 0,
        avgDailyCarbs: daysWithMeals > 0 ? Math.round(totalCarbs / daysWithMeals) : 0,
        avgDailyFat: daysWithMeals > 0 ? Math.round(totalFat / daysWithMeals) : 0,
        totalMealsLogged: weekMeals.length,
        daysWithMealsLogged: daysWithMeals,
      },
      activity: {
        totalSteps,
        avgDailySteps: 7 > 0 ? Math.round(totalSteps / 7) : 0,
        totalActiveMinutes,
        daysActive,
      },
      workout: {
        workoutsCompleted: completedWorkouts.length,
        totalDurationMinutes: totalWorkoutDuration,
        avgDurationMinutes: completedWorkouts.length > 0 ? Math.round(totalWorkoutDuration / completedWorkouts.length) : 0,
        categories,
      },
      consistency: {
        daysTracked: 7,
        checkInsCompleted: weekCheckIns.length,
        mealsLogged: weekMeals.length,
        weightLogged: weekMeasurements.length,
      },
    };

    await IndexedDBRepository.saveWeeklyReport(report);
    return report;
  }

  static async getReports(userId: string): Promise<WeeklyReportData[]> {
    return IndexedDBRepository.getWeeklyReports(userId);
  }

  static async getLatest(userId: string): Promise<WeeklyReportData | null> {
    const reports = await this.getReports(userId);
    return reports.length > 0 ? reports[0] : null;
  }
}
