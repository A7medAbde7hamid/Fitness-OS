import { describe, it, expect, beforeEach } from 'vitest';
import { MealConfirmationService, PendingMeal } from '../mealConfirmationService';
import { FoodAnalysisResult } from '../foodAnalysisService';
import { AppStorageRepository } from '../../db/storage';

const TEST_USER_ID = 'test_user_meal_confirmation';

const mockAnalysisResult: FoodAnalysisResult = {
  items: [
    { name: 'Grilled Chicken', portion: '200g', grams: 200, calories: 330, protein: 62, carbs: 0, fat: 7.2, confidence: 0.92 },
    { name: 'Brown Rice', portion: '1 cup', grams: 160, calories: 208, protein: 4.3, carbs: 45.1, fat: 1.8, confidence: 0.95 },
  ],
  totalCalories: 538,
  totalProtein: 66.3,
  totalCarbs: 45.1,
  totalFat: 9.0,
  confidence: 0.935,
  confidenceLevel: 'high',
  source: 'gemini_vision',
};

describe('MealConfirmationService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createPendingMeal', () => {
    it('creates a pending meal with correct fields', () => {
      const pending = MealConfirmationService.createPendingMeal(
        TEST_USER_ID,
        'lunch',
        mockAnalysisResult,
        'Chicken and rice'
      );

      expect(pending.id).toMatch(/^pending_/);
      expect(pending.mealType).toBe('lunch');
      expect(pending.items).toHaveLength(2);
      expect(pending.totalCalories).toBe(538);
      expect(pending.totalProtein).toBe(66.3);
      expect(pending.confidenceLevel).toBe('high');
      expect(pending.source).toBe('gemini_vision');
      expect(pending.status).toBe('pending_review');
      expect(pending.description).toBe('Chicken and rice');
    });

    it('saves pending meal to storage', () => {
      const pending = MealConfirmationService.createPendingMeal(
        TEST_USER_ID,
        'breakfast',
        mockAnalysisResult
      );

      const stored = MealConfirmationService.getPendingMeals(TEST_USER_ID);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(pending.id);
    });
  });

  describe('getPendingMeal', () => {
    it('retrieves a pending meal by ID', () => {
      const pending = MealConfirmationService.createPendingMeal(
        TEST_USER_ID,
        'lunch',
        mockAnalysisResult
      );

      const found = MealConfirmationService.getPendingMeal(TEST_USER_ID, pending.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(pending.id);
    });

    it('returns null for nonexistent ID', () => {
      const found = MealConfirmationService.getPendingMeal(TEST_USER_ID, 'nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('discardMeal', () => {
    it('removes a pending meal from storage', () => {
      const pending = MealConfirmationService.createPendingMeal(
        TEST_USER_ID,
        'lunch',
        mockAnalysisResult
      );

      const discarded = MealConfirmationService.discardMeal(TEST_USER_ID, pending.id);
      expect(discarded).toBe(true);

      const remaining = MealConfirmationService.getPendingMeals(TEST_USER_ID);
      expect(remaining).toHaveLength(0);
    });

    it('returns false for nonexistent ID', () => {
      const discarded = MealConfirmationService.discardMeal(TEST_USER_ID, 'nonexistent');
      expect(discarded).toBe(false);
    });
  });

  describe('updateItemInPending', () => {
    it('updates a food item in a pending meal', () => {
      const pending = MealConfirmationService.createPendingMeal(
        TEST_USER_ID,
        'lunch',
        mockAnalysisResult
      );

      const updated = MealConfirmationService.updateItemInPending(
        TEST_USER_ID,
        pending.id,
        0,
        { calories: 400, protein: 70 }
      );

      expect(updated).not.toBeNull();
      expect(updated!.items[0].calories).toBe(400);
      expect(updated!.items[0].protein).toBe(70);
      // Totals should be recalculated
      expect(updated!.totalCalories).toBe(400 + 208); // Updated + unchanged
    });

    it('returns null for out-of-range index', () => {
      const pending = MealConfirmationService.createPendingMeal(
        TEST_USER_ID,
        'lunch',
        mockAnalysisResult
      );

      const updated = MealConfirmationService.updateItemInPending(
        TEST_USER_ID,
        pending.id,
        99,
        { calories: 400 }
      );

      expect(updated).toBeNull();
    });
  });

  describe('removeItemFromPending', () => {
    it('removes a food item from a pending meal', () => {
      const pending = MealConfirmationService.createPendingMeal(
        TEST_USER_ID,
        'lunch',
        mockAnalysisResult
      );

      const updated = MealConfirmationService.removeItemFromPending(
        TEST_USER_ID,
        pending.id,
        0
      );

      expect(updated).not.toBeNull();
      expect(updated!.items).toHaveLength(1);
      expect(updated!.items[0].name).toBe('Brown Rice');
      // Totals should be recalculated
      expect(updated!.totalCalories).toBe(208);
    });
  });

  describe('addItemToPending', () => {
    it('adds a new food item to a pending meal', () => {
      const pending = MealConfirmationService.createPendingMeal(
        TEST_USER_ID,
        'lunch',
        mockAnalysisResult
      );

      const updated = MealConfirmationService.addItemToPending(
        TEST_USER_ID,
        pending.id,
        { name: 'Broccoli', portion: '100g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, confidence: 0.95 }
      );

      expect(updated).not.toBeNull();
      expect(updated!.items).toHaveLength(3);
      expect(updated!.items[2].name).toBe('Broccoli');
    });
  });
});
