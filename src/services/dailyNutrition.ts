/**
 * Daily Nutrition Aggregation Service
 * Deterministic (no LLM) aggregation of daily meal data.
 * Provides macro breakdowns, meal-by-meal summaries, and progress towards targets.
 */

import { Meal, MealType, UserProfile } from '../types';
import { AppStorageRepository } from '../db/storage';

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface MealSummary {
  type: MealType;
  label: string;
  labelAr: string;
  meals: Meal[];
  totals: NutritionTotals;
  itemCount: number;
}

export interface DailyNutritionReport {
  date: string;
  totals: NutritionTotals;
  targets: NutritionTotals;
  progress: {
    caloriesPercent: number;
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
  remaining: NutritionTotals;
  mealsByType: MealSummary[];
  totalMealCount: number;
  averageConfidence: number;
}

const MEAL_TYPE_LABELS: Record<MealType, { en: string; ar: string }> = {
  breakfast: { en: 'Breakfast', ar: 'الفطور' },
  lunch: { en: 'Lunch', ar: 'الغداء' },
  dinner: { en: 'Dinner', ar: 'العشاء' },
  snack: { en: 'Snack', ar: 'سناك' },
};

export class DailyNutritionService {
  /**
   * Get all meals for a specific date (YYYY-MM-DD).
   */
  static getMealsForDate(userId: string, date: string): Meal[] {
    const allMeals = AppStorageRepository.getMeals(userId);
    return allMeals.filter((meal) => {
      const mealDate = new Date(meal.loggedAt).toISOString().split('T')[0];
      return mealDate === date;
    });
  }

  /**
   * Aggregate nutrition totals from a list of meals.
   */
  static aggregateMeals(meals: Meal[]): NutritionTotals {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: Math.round((acc.protein + meal.totalProtein) * 10) / 10,
        carbs: Math.round((acc.carbs + meal.totalCarbs) * 10) / 10,
        fat: Math.round((acc.fat + meal.totalFat) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  /**
   * Build a full daily nutrition report for a given date.
   */
  static getDailyReport(userId: string, date: string): DailyNutritionReport {
    const meals = DailyNutritionService.getMealsForDate(userId, date);
    const profile = AppStorageRepository.getProfile(userId);

    const totals = DailyNutritionService.aggregateMeals(meals);

    const targets: NutritionTotals = {
      calories: profile?.dailyCalorieTarget || 2150,
      protein: profile?.dailyProteinTargetGrams || 160,
      carbs: profile?.dailyCarbsTargetGrams || 210,
      fat: profile?.dailyFatTargetGrams || 65,
    };

    const progress = {
      caloriesPercent: targets.calories > 0 ? Math.min(100, Math.round((totals.calories / targets.calories) * 100)) : 0,
      proteinPercent: targets.protein > 0 ? Math.min(100, Math.round((totals.protein / targets.protein) * 100)) : 0,
      carbsPercent: targets.carbs > 0 ? Math.min(100, Math.round((totals.carbs / targets.carbs) * 100)) : 0,
      fatPercent: targets.fat > 0 ? Math.min(100, Math.round((totals.fat / targets.fat) * 100)) : 0,
    };

    const remaining = {
      calories: Math.max(0, targets.calories - totals.calories),
      protein: Math.max(0, Math.round((targets.protein - totals.protein) * 10) / 10),
      carbs: Math.max(0, Math.round((targets.carbs - totals.carbs) * 10) / 10),
      fat: Math.max(0, Math.round((targets.fat - totals.fat) * 10) / 10),
    };

    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealsByType: MealSummary[] = mealTypes.map((type) => {
      const typeMeals = meals.filter((m) => m.mealType === type);
      return {
        type,
        label: MEAL_TYPE_LABELS[type].en,
        labelAr: MEAL_TYPE_LABELS[type].ar,
        meals: typeMeals,
        totals: DailyNutritionService.aggregateMeals(typeMeals),
        itemCount: typeMeals.reduce((sum, m) => sum + m.items.length, 0),
      };
    });

    const allConfidences = meals
      .map((m) => m.aiConfidence)
      .filter((c): c is number => c !== undefined);
    const averageConfidence =
      allConfidences.length > 0
        ? Math.round((allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length) * 100) / 100
        : 0;

    return {
      date,
      totals,
      targets,
      progress,
      remaining,
      mealsByType,
      totalMealCount: meals.length,
      averageConfidence,
    };
  }

  /**
   * Get remaining macro gaps for meal recommendations.
   */
  static getRemainingGaps(userId: string, date?: string): NutritionTotals {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const report = DailyNutritionService.getDailyReport(userId, targetDate);
    return report.remaining;
  }
}
