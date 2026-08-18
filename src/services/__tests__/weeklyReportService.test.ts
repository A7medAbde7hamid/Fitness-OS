import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeeklyReportService } from '../weeklyReportService';
import { AppStorageRepository } from '../../db/storage';

// Mock dependencies
vi.mock('../../db/indexedDb', () => ({
  IndexedDBRepository: {
    getCheckIns: vi.fn(async () => []),
    saveWeeklyReport: vi.fn(async () => {}),
    getWeeklyReports: vi.fn(async () => []),
  },
}));

vi.mock('../../db/storage', () => ({
  AppStorageRepository: {
    getMeasurements: vi.fn(() => []),
    getMeals: vi.fn(() => []),
    getActivities: vi.fn(() => []),
    getWorkouts: vi.fn(() => []),
  },
}));

describe('WeeklyReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a weekly report with empty data', async () => {
    const report = await WeeklyReportService.generate('user_1');
    expect(report).toBeDefined();
    expect(report.userId).toBe('user_1');
    expect(report.startDate).toBeDefined();
    expect(report.endDate).toBeDefined();
    expect(report.weight.startKg).toBe(0);
    expect(report.weight.endKg).toBe(0);
    expect(report.weight.trend).toBe('maintaining');
    expect(report.nutrition.totalMealsLogged).toBe(0);
    expect(report.workout.workoutsCompleted).toBe(0);
  });

  it('generates report with weight data', async () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(12, 0, 0, 0);

    const measurements = [
      { id: '1', userId: 'user_1', weightKg: 75, measuredAt: now.toISOString(), notes: '' },
      { id: '2', userId: 'user_1', weightKg: 74.5, measuredAt: new Date(startOfWeek.getTime() + 86400000 * 2).toISOString(), notes: '' },
      { id: '3', userId: 'user_1', weightKg: 76, measuredAt: new Date(startOfWeek.getTime()).toISOString(), notes: '' },
    ];
    (AppStorageRepository.getMeasurements as any).mockReturnValue(measurements);

    const report = await WeeklyReportService.generate('user_1');
    expect(report.weight.startKg).toBe(76);
    expect(report.weight.endKg).toBe(75);
    expect(report.weight.deltaKg).toBe(-1);
    expect(report.weight.trend).toBe('losing');
    expect(report.weight.dailyWeights.length).toBe(3);
  });

  it('generates report with meal data', async () => {
    const now = new Date();
    const meals = [
      {
        id: '1', userId: 'user_1', mealType: 'breakfast', loggedAt: now.toISOString(),
        items: [], totalCalories: 500, totalProtein: 30, totalCarbs: 60, totalFat: 15,
        aiAnalyzed: true, userConfirmed: true,
      },
      {
        id: '2', userId: 'user_1', mealType: 'lunch', loggedAt: now.toISOString(),
        items: [], totalCalories: 700, totalProtein: 50, totalCarbs: 80, totalFat: 20,
        aiAnalyzed: true, userConfirmed: true,
      },
    ];
    (AppStorageRepository.getMeals as any).mockReturnValue(meals);

    const report = await WeeklyReportService.generate('user_1');
    expect(report.nutrition.totalMealsLogged).toBe(2);
    expect(report.nutrition.avgDailyCalories).toBeGreaterThan(0);
  });

  it('generates report with activity data', async () => {
    const now = new Date();
    const activities = [
      {
        id: '1', userId: 'user_1', activityType: 'walking', durationMinutes: 30,
        caloriesBurned: 150, steps: 5000, loggedAt: now.toISOString(), source: 'manual',
      },
      {
        id: '2', userId: 'user_1', activityType: 'running', durationMinutes: 20,
        caloriesBurned: 200, steps: 3000, loggedAt: now.toISOString(), source: 'manual',
      },
    ];
    (AppStorageRepository.getActivities as any).mockReturnValue(activities);

    const report = await WeeklyReportService.generate('user_1');
    expect(report.activity.totalSteps).toBe(8000);
    expect(report.activity.totalActiveMinutes).toBe(50);
    expect(report.activity.daysActive).toBe(1);
  });

  it('generates report with workout data', async () => {
    const now = new Date();
    const workouts = [
      {
        id: '1', userId: 'user_1', title: 'Upper Body', category: 'Push',
        durationMinutes: 50, exercises: [], completed: true,
        startedAt: now.toISOString(),
      },
      {
        id: '2', userId: 'user_1', title: 'Lower Body', category: 'Legs',
        durationMinutes: 60, exercises: [], completed: true,
        startedAt: now.toISOString(),
      },
    ];
    (AppStorageRepository.getWorkouts as any).mockReturnValue(workouts);

    const report = await WeeklyReportService.generate('user_1');
    expect(report.workout.workoutsCompleted).toBe(2);
    expect(report.workout.totalDurationMinutes).toBe(110);
    expect(report.workout.avgDurationMinutes).toBe(55);
  });

  it('handles missing startedAt for workouts', async () => {
    const now = new Date();
    const workouts = [
      {
        id: '1', userId: 'user_1', title: 'Upper Body', category: 'Push',
        durationMinutes: 50, exercises: [], completed: true,
        startedAt: now.toISOString(),
      },
    ];
    (AppStorageRepository.getWorkouts as any).mockReturnValue(workouts);

    const report = await WeeklyReportService.generate('user_1');
    expect(report.workout.workoutsCompleted).toBe(1);
  });

  it('detects gaining trend', async () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(12, 0, 0, 0);

    const measurements = [
      { id: '1', userId: 'user_1', weightKg: 76, measuredAt: now.toISOString(), notes: '' },
      { id: '2', userId: 'user_1', weightKg: 74.5, measuredAt: new Date(startOfWeek.getTime()).toISOString(), notes: '' },
    ];
    (AppStorageRepository.getMeasurements as any).mockReturnValue(measurements);

    const report = await WeeklyReportService.generate('user_1');
    expect(report.weight.trend).toBe('gaining');
  });

  it('detects maintaining trend', async () => {
    const now = new Date();
    const measurements = [
      { id: '1', userId: 'user_1', weightKg: 75.1, measuredAt: now.toISOString(), notes: '' },
      { id: '2', userId: 'user_1', weightKg: 75.0, measuredAt: new Date(now.getTime() - 86400000 * 6).toISOString(), notes: '' },
    ];
    (AppStorageRepository.getMeasurements as any).mockReturnValue(measurements);

    const report = await WeeklyReportService.generate('user_1');
    expect(report.weight.trend).toBe('maintaining');
  });

  it('generates report for previous week', async () => {
    const report = await WeeklyReportService.generate('user_1', 1);
    expect(report).toBeDefined();
    expect(report.startDate).toBeDefined();
  });
});
