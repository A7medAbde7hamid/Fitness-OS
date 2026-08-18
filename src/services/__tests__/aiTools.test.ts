import { describe, it, expect, beforeEach } from 'vitest';
import { AppStorageRepository } from '../../db/storage';
import { AIContextBuilder } from '../aiContextBuilder';
import { getTool, getAllTools, getToolNames } from '../aiTools';

const TEST_USER_ID = 'test_user_ai_tools';

describe('AIContextBuilder', () => {
  beforeEach(() => {
    localStorage.clear();
    AppStorageRepository.seedDemoUser('en');
  });

  describe('buildContext', () => {
    it('assembles user-scoped context with profile and goal', async () => {
      const context = await AIContextBuilder.buildContext({
        userId: 'demo_user_001',
        language: 'en',
      });

      const parsed = JSON.parse(context);
      expect(parsed.locale).toBe('en');
      expect(parsed.direction).toBe('ltr');
      expect(parsed.PROFILE).toBeDefined();
      expect(parsed.PROFILE.name).toBe('Alex Thorne');
      expect(parsed.PROFILE.currentWeightKg).toBe(74.2);
      expect(parsed.PROFILE.dailyTargets).toBeDefined();
      expect(parsed.PROFILE.dailyTargets.calories).toBe(2150);
    });

    it('includes weight trend data', async () => {
      const context = await AIContextBuilder.buildContext({
        userId: 'demo_user_001',
        language: 'en',
      });

      const parsed = JSON.parse(context);
      expect(parsed.RECENT.weightTrend).toBeDefined();
      expect(parsed.RECENT.weightTrend.length).toBeGreaterThan(0);
    });

    it('includes today summary data', async () => {
      const context = await AIContextBuilder.buildContext({
        userId: 'demo_user_001',
        language: 'en',
      });

      const parsed = JSON.parse(context);
      expect(parsed.TODAY).toBeDefined();
      expect(parsed.TODAY.caloriesConsumed).toBe(1200);
      expect(parsed.TODAY.caloriesTarget).toBe(2150);
      expect(parsed.TODAY.steps).toBe(7420);
    });

    it('includes recent meals', async () => {
      const context = await AIContextBuilder.buildContext({
        userId: 'demo_user_001',
        language: 'en',
      });

      const parsed = JSON.parse(context);
      expect(parsed.RECENT.meals).toBeDefined();
      expect(parsed.RECENT.meals.length).toBeGreaterThan(0);
    });

    it('builds Arabic context correctly', async () => {
      AppStorageRepository.seedDemoUser('ar');
      const context = await AIContextBuilder.buildContext({
        userId: 'demo_user_001',
        language: 'ar',
      });

      const parsed = JSON.parse(context);
      expect(parsed.locale).toBe('ar');
      expect(parsed.direction).toBe('rtl');
    });
  });

  describe('buildDailyRecommendation', () => {
    it('returns recommendations with real numbers', () => {
      const recommendation = AIContextBuilder.buildDailyRecommendation('demo_user_001', 'en');

      expect(recommendation.caloriesRemaining).toBeGreaterThan(0);
      expect(recommendation.proteinRemaining).toBeGreaterThan(0);
      expect(recommendation.focus).toBeDefined();
      expect(recommendation.suggestedWorkout).toBeDefined();
    });

    it('returns Arabic focus text', () => {
      const recommendation = AIContextBuilder.buildDailyRecommendation('demo_user_001', 'ar');
      expect(typeof recommendation.focus).toBe('string');
      expect(typeof recommendation.suggestedWorkout).toBe('string');
    });
  });
});

describe('AITools', () => {
  beforeEach(() => {
    localStorage.clear();
    AppStorageRepository.seedDemoUser('en');
  });

  describe('tool registry', () => {
    it('registers all expected tools', () => {
      const names = getToolNames();

      // Read tools
      expect(names).toContain('get_profile');
      expect(names).toContain('get_goal');
      expect(names).toContain('get_daily_summary');
      expect(names).toContain('get_progress');
      expect(names).toContain('get_recent_meals');
      expect(names).toContain('get_recent_activity');
      expect(names).toContain('get_recent_workouts');
      expect(names).toContain('get_today_nutrition');
      expect(names).toContain('get_today_activity');
      expect(names).toContain('get_today_workout');
      expect(names).toContain('get_weekly_report');

      // Write tools
      expect(names).toContain('log_weight');
      expect(names).toContain('log_activity');
      expect(names).toContain('log_meal_described');
      expect(names).toContain('log_workout');
    });

    it('returns undefined for unknown tool', () => {
      expect(getTool('nonexistent_tool')).toBeUndefined();
    });
  });

  describe('get_profile tool', () => {
    it('returns user profile data', async () => {
      const tool = getTool('get_profile');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, 'demo_user_001', 'en');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as any).currentWeightKg).toBe(74.2);
      expect((result.data as any).dailyCalorieTarget).toBe(2150);
    });

    it('returns failure for nonexistent user', async () => {
      const tool = getTool('get_profile');
      const result = await tool!.execute({}, 'nonexistent_user', 'en');
      expect(result.success).toBe(false);
    });
  });

  describe('get_daily_summary tool', () => {
    it('returns today summary', async () => {
      const tool = getTool('get_daily_summary');
      const result = await tool!.execute({}, 'demo_user_001', 'en');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.caloriesConsumed).toBe(1200);
      expect(data.caloriesTarget).toBe(2150);
      expect(data.steps).toBe(7420);
      expect(data.workoutCompleted).toBe(false);
    });
  });

  describe('get_goal tool', () => {
    it('returns active goal', async () => {
      const tool = getTool('get_goal');
      const result = await tool!.execute({}, 'demo_user_001', 'en');

      expect(result.success).toBe(true);
    });
  });

  describe('get_progress tool', () => {
    it('returns progress stats', async () => {
      const tool = getTool('get_progress');
      const result = await tool!.execute({}, 'demo_user_001', 'en');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as any).progressPercent).toBeDefined();
    });
  });

  describe('get_recent_meals tool', () => {
    it('returns recent meals', async () => {
      const tool = getTool('get_recent_meals');
      const result = await tool!.execute({}, 'demo_user_001', 'en');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('get_weekly_report tool', () => {
    it('returns weekly report', async () => {
      const tool = getTool('get_weekly_report');
      const result = await tool!.execute({}, 'demo_user_001', 'en');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as any).averageWeightKg).toBeDefined();
    });
  });

  describe('log_weight tool', () => {
    it('logs weight successfully with valid input', async () => {
      const tool = getTool('log_weight');
      const result = await tool!.execute({ weight_kg: 72.5 }, 'demo_user_001', 'en');

      expect(result.success).toBe(true);
      expect(result.actionTaken).toBe('log_weight');
      expect((result.data as any).weightKg).toBe(72.5);
    });

    it('fails with weight below minimum', () => {
      const tool = getTool('log_weight');
      expect(() => {
        tool!.schema.parse({ weight_kg: 10 });
      }).toThrow();
    });

    it('fails with weight above maximum', () => {
      const tool = getTool('log_weight');
      expect(() => {
        tool!.schema.parse({ weight_kg: 500 });
      }).toThrow();
    });

    it('validates schema before execution', () => {
      const tool = getTool('log_weight');
      expect(() => {
        tool!.schema.parse({ weight_kg: 'not a number' });
      }).toThrow();
    });
  });

  describe('log_activity tool', () => {
    it('logs activity successfully', async () => {
      const tool = getTool('log_activity');
      const result = await tool!.execute(
        { activity_type: 'walking', duration_minutes: 45 },
        'demo_user_001',
        'en'
      );

      expect(result.success).toBe(true);
      expect(result.actionTaken).toBe('log_activity');
    });

    it('fails when activity_type is missing', () => {
      const tool = getTool('log_activity');
      expect(() => {
        tool!.schema.parse({ duration_minutes: 45 });
      }).toThrow();
    });
  });

  describe('log_meal_described tool', () => {
    it('creates pending meal for review', async () => {
      const tool = getTool('log_meal_described');
      const result = await tool!.execute(
        { description: '200g chicken breast with rice', meal_type: 'lunch' },
        'demo_user_001',
        'en'
      );

      expect(result.success).toBe(true);
      expect(result.actionTaken).toBe('log_meal');
      expect(result.requiresConfirmation).toBe(true);
      expect((result.data as any).pendingMealId).toBeDefined();
    });
  });

  describe('log_weight tool with user scoping', () => {
    it('tool execution is scoped to userId parameter', async () => {
      const tool = getTool('log_weight');
      await tool!.execute({ weight_kg: 70 }, 'demo_user_001', 'en');
      const measurements1 = AppStorageRepository.getMeasurements('demo_user_001');

      await tool!.execute({ weight_kg: 80 }, 'other_user_999', 'en');
      const measurements2 = AppStorageRepository.getMeasurements('other_user_999');

      // Each user only sees their own measurements
      expect(measurements1.length).toBeGreaterThan(0);
      expect(measurements2.length).toBe(1);
      expect(measurements1[0].weightKg).toBe(70);
      expect(measurements2[0].weightKg).toBe(80);
    });
  });
});
