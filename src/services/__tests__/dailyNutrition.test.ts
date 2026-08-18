import { describe, it, expect, beforeEach } from 'vitest';
import { DailyNutritionService } from '../dailyNutrition';
import { AppStorageRepository } from '../../db/storage';
import { Meal } from '../../types';

const TEST_USER_ID = 'test_user_daily_nutrition';
const TODAY = new Date().toISOString().split('T')[0];

const mockMeals: Meal[] = [
  {
    id: 'meal_test_1',
    userId: TEST_USER_ID,
    mealType: 'breakfast',
    loggedAt: `${TODAY}T08:30:00Z`,
    items: [
      { name: 'Eggs', portion: '2 eggs', calories: 143, protein: 12.6, carbs: 1.4, fat: 9.5, confidence: 0.95 },
    ],
    totalCalories: 143,
    totalProtein: 12.6,
    totalCarbs: 1.4,
    totalFat: 9.5,
    aiAnalyzed: true,
    aiConfidence: 0.95,
    userConfirmed: true,
  },
  {
    id: 'meal_test_2',
    userId: TEST_USER_ID,
    mealType: 'lunch',
    loggedAt: `${TODAY}T13:00:00Z`,
    items: [
      { name: 'Chicken Breast', portion: '200g', calories: 330, protein: 62, carbs: 0, fat: 7.2, confidence: 0.92 },
      { name: 'Rice', portion: '1 cup', calories: 208, protein: 4.3, carbs: 45.1, fat: 1.8, confidence: 0.95 },
    ],
    totalCalories: 538,
    totalProtein: 66.3,
    totalCarbs: 45.1,
    totalFat: 9.0,
    aiAnalyzed: true,
    aiConfidence: 0.935,
    userConfirmed: true,
  },
];

describe('DailyNutritionService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Seed demo user for profile targets
    AppStorageRepository.seedDemoUser('en');
    // Clear seeded meals and set our test meals
    AppStorageRepository.saveMeals(TEST_USER_ID, mockMeals);
  });

  describe('getMealsForDate', () => {
    it('returns meals for the specified date', () => {
      const meals = DailyNutritionService.getMealsForDate(TEST_USER_ID, TODAY);
      expect(meals).toHaveLength(2);
    });

    it('returns empty array for date with no meals', () => {
      const meals = DailyNutritionService.getMealsForDate(TEST_USER_ID, '2020-01-01');
      expect(meals).toHaveLength(0);
    });
  });

  describe('aggregateMeals', () => {
    it('correctly sums macros from multiple meals', () => {
      const totals = DailyNutritionService.aggregateMeals(mockMeals);

      expect(totals.calories).toBe(681); // 143 + 538
      expect(totals.protein).toBe(78.9); // 12.6 + 66.3
      expect(totals.carbs).toBe(46.5);   // 1.4 + 45.1
      expect(totals.fat).toBe(18.5);     // 9.5 + 9.0
    });

    it('returns zeros for empty array', () => {
      const totals = DailyNutritionService.aggregateMeals([]);
      expect(totals.calories).toBe(0);
      expect(totals.protein).toBe(0);
      expect(totals.carbs).toBe(0);
      expect(totals.fat).toBe(0);
    });
  });

  describe('getDailyReport', () => {
    it('builds a complete daily report', () => {
      const report = DailyNutritionService.getDailyReport(TEST_USER_ID, TODAY);

      expect(report.date).toBe(TODAY);
      expect(report.totals.calories).toBe(681);
      expect(report.totalMealCount).toBe(2);
      expect(report.averageConfidence).toBeGreaterThan(0);
    });

    it('calculates correct progress percentages', () => {
      const report = DailyNutritionService.getDailyReport(TEST_USER_ID, TODAY);

      // Demo profile: 2150 kcal target, 681 consumed = ~32%
      expect(report.progress.caloriesPercent).toBeGreaterThan(0);
      expect(report.progress.caloriesPercent).toBeLessThan(100);
    });

    it('calculates correct remaining macros', () => {
      const report = DailyNutritionService.getDailyReport(TEST_USER_ID, TODAY);

      expect(report.remaining.calories).toBeGreaterThan(0);
      expect(report.remaining.protein).toBeGreaterThan(0);
    });

    it('groups meals by type', () => {
      const report = DailyNutritionService.getDailyReport(TEST_USER_ID, TODAY);

      expect(report.mealsByType).toHaveLength(4); // breakfast, lunch, dinner, snack
      const breakfast = report.mealsByType.find((m) => m.type === 'breakfast');
      expect(breakfast?.meals).toHaveLength(1);
      const lunch = report.mealsByType.find((m) => m.type === 'lunch');
      expect(lunch?.meals).toHaveLength(1);
      const dinner = report.mealsByType.find((m) => m.type === 'dinner');
      expect(dinner?.meals).toHaveLength(0);
    });
  });

  describe('getRemainingGaps', () => {
    it('returns remaining macros for today', () => {
      const gaps = DailyNutritionService.getRemainingGaps(TEST_USER_ID, TODAY);

      expect(gaps.calories).toBeGreaterThan(0);
      expect(gaps.protein).toBeGreaterThan(0);
      expect(gaps.carbs).toBeGreaterThan(0);
      expect(gaps.fat).toBeGreaterThan(0);
    });
  });
});
