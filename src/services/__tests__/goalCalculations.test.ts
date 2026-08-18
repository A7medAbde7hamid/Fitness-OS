import { describe, it, expect } from 'vitest';
import { GoalCalculationsService } from '../goalCalculations';
import { Goal, WeightMeasurement } from '../../types';

const makeGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'goal_1',
  userId: 'user_1',
  title: 'Lose weight',
  category: 'weight',
  metricType: 'weight_kg',
  startValue: 80,
  currentValue: 76,
  targetValue: 72,
  startDate: '2026-01-01',
  targetDate: '2026-06-30',
  status: 'in_progress',
  ...overrides,
});

const makeMeasurements = (weights: number[], daysAgo: number[] = []): WeightMeasurement[] =>
  weights.map((w, i) => ({
    id: `m_${i}`,
    userId: 'user_1',
    weightKg: w,
    measuredAt: new Date(Date.now() - (daysAgo[i] || i) * 86400000).toISOString(),
  }));

describe('GoalCalculationsService', () => {
  describe('calculateGoalProgress', () => {
    it('calculates progress percent correctly', () => {
      const goal = makeGoal({ startValue: 80, currentValue: 76, targetValue: 72 });
      const progress = GoalCalculationsService.calculateGoalProgress(goal, []);
      expect(progress.progressPercent).toBeGreaterThan(0);
      expect(progress.progressPercent).toBeLessThanOrEqual(100);
    });

    it('calculates remaining value', () => {
      const goal = makeGoal({ currentValue: 76, targetValue: 72 });
      const progress = GoalCalculationsService.calculateGoalProgress(goal, []);
      expect(progress.remainingValue).toBe(4);
    });

    it('detects losing trend', () => {
      const goal = makeGoal({ startValue: 80, currentValue: 76, targetValue: 72 });
      const measurements = makeMeasurements([76, 76.5, 77, 77.5, 78, 78.5, 79, 79.5], [0, 1, 2, 3, 4, 5, 6, 7]);
      const progress = GoalCalculationsService.calculateGoalProgress(goal, measurements);
      expect(progress.trendDirection).toBe('losing');
    });

    it('returns safety warnings for extreme rates', () => {
      const goal = makeGoal({ startValue: 90, currentValue: 82, targetValue: 72, startDate: '2026-01-01' });
      const measurements = makeMeasurements([82, 83, 84, 85, 86, 87, 88, 89]);
      const progress = GoalCalculationsService.calculateGoalProgress(goal, measurements);
      expect(progress.safetyWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('getWeightTrendData', () => {
    it('returns empty for no measurements', () => {
      const data = GoalCalculationsService.getWeightTrendData([], 30);
      expect(data).toEqual([]);
    });

    it('filters by days', () => {
      const measurements = makeMeasurements([76, 77, 78], [0, 15, 60]);
      const data = GoalCalculationsService.getWeightTrendData(measurements, 30);
      expect(data.length).toBe(2);
    });

    it('computes rolling average after 7 points', () => {
      const weights = [76, 76.1, 76.2, 76.3, 76.4, 76.5, 76.6, 76.7];
      const measurements = makeMeasurements(weights, [0, 1, 2, 3, 4, 5, 6, 7]);
      const data = GoalCalculationsService.getWeightTrendData(measurements, 30);
      expect(data[6].rollingAvg).not.toBeNull();
      expect(data[7].rollingAvg).not.toBeNull();
    });
  });
});
