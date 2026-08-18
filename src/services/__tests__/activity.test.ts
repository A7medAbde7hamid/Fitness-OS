import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityService } from '../activity';

describe('ActivityService', () => {
  describe('estimateCalories', () => {
    it('estimates calories for walking', () => {
      const cals = ActivityService.estimateCalories('walking', 30, 'moderate', 74);
      expect(cals).toBeGreaterThan(100);
      expect(cals).toBeLessThan(400);
    });

    it('estimates calories for running', () => {
      const cals = ActivityService.estimateCalories('running', 30, 'moderate', 74);
      expect(cals).toBeGreaterThan(200);
    });

    it('returns higher calories for higher intensity', () => {
      const low = ActivityService.estimateCalories('running', 30, 'low', 74);
      const high = ActivityService.estimateCalories('running', 30, 'high', 74);
      expect(high).toBeGreaterThan(low);
    });

    it('returns higher calories for longer duration', () => {
      const short = ActivityService.estimateCalories('running', 15, 'moderate', 74);
      const long = ActivityService.estimateCalories('running', 60, 'moderate', 74);
      expect(long).toBeGreaterThan(short);
    });
  });

  describe('getActivityStats', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns zero stats for no activities', () => {
      const stats = ActivityService.getActivityStats('nonexistent_user');
      expect(stats.totalDurationMinutes).toBe(0);
      expect(stats.activityCount).toBe(0);
    });
  });
});
