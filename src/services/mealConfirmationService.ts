/**
 * Meal Confirmation Service
 * Manages the review → confirm/edit/discard workflow for AI-analyzed meals.
 * Ensures Gemini estimates are never saved without user awareness.
 */

import { FoodItem, Meal, MealType } from '../types';
import { AppStorageRepository } from '../db/storage';
import {
  FoodAnalysisResult,
  ConfidenceLevel,
  FoodAnalysisService,
} from './foodAnalysisService';

// ── Pending Meal State ──

export interface PendingMeal {
  id: string;
  mealType: MealType;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  source: FoodAnalysisResult['source'];
  imageUrl?: string;
  description?: string;
  notes?: string;
  createdAt: string;
  status: 'pending_review' | 'confirmed' | 'edited' | 'discarded';
}

export interface MealConfirmationResult {
  success: boolean;
  meal?: Meal;
  error?: string;
}

// ── Meal Confirmation Service ──

export class MealConfirmationService {
  private static STORAGE_KEY = 'ai_fitness_os_pending_meals';

  /**
   * Create a PendingMeal from a FoodAnalysisResult.
   * This enters the review flow — never auto-saved.
   */
  static createPendingMeal(
    userId: string,
    mealType: MealType,
    analysis: FoodAnalysisResult,
    description?: string,
    notes?: string
  ): PendingMeal {
    const pending: PendingMeal = {
      id: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mealType,
      items: [...analysis.items],
      totalCalories: analysis.totalCalories,
      totalProtein: analysis.totalProtein,
      totalCarbs: analysis.totalCarbs,
      totalFat: analysis.totalFat,
      confidence: analysis.confidence,
      confidenceLevel: analysis.confidenceLevel,
      source: analysis.source,
      imageUrl: analysis.imageUrl,
      description,
      notes,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
    };

    MealConfirmationService.savePendingMeal(userId, pending);
    return pending;
  }

  /**
   * Confirm a pending meal as-is. Converts to a real Meal and logs it.
   */
  static confirmMeal(userId: string, pendingId: string): MealConfirmationResult {
    const pending = MealConfirmationService.getPendingMeal(userId, pendingId);
    if (!pending) {
      return { success: false, error: 'Pending meal not found.' };
    }

    const meal = MealConfirmationService.convertToMeal(userId, pending);
    MealConfirmationService.logMealAndCleanup(userId, pendingId, meal);
    return { success: true, meal };
  }

  /**
   * Edit a pending meal: update items, recalculate totals, then confirm.
   */
  static editAndConfirm(
    userId: string,
    pendingId: string,
    updates: {
      items?: FoodItem[];
      mealType?: MealType;
      notes?: string;
    }
  ): MealConfirmationResult {
    const pending = MealConfirmationService.getPendingMeal(userId, pendingId);
    if (!pending) {
      return { success: false, error: 'Pending meal not found.' };
    }

    const items = updates.items || pending.items;
    const totalCalories = items.reduce((sum, it) => sum + it.calories, 0);
    const totalProtein = Math.round(items.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(items.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
    const totalFat = Math.round(items.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;
    const avgConfidence =
      items.length > 0
        ? items.reduce((sum, it) => sum + it.confidence, 0) / items.length
        : 0;

    const edited: PendingMeal = {
      ...pending,
      items,
      mealType: updates.mealType || pending.mealType,
      notes: updates.notes ?? pending.notes,
      totalCalories: Math.round(totalCalories),
      totalProtein,
      totalCarbs,
      totalFat,
      confidence: Math.round(avgConfidence * 100) / 100,
      confidenceLevel: FoodAnalysisService.classifyConfidence(avgConfidence),
      status: 'edited',
    };

    const meal = MealConfirmationService.convertToMeal(userId, edited);
    MealConfirmationService.logMealAndCleanup(userId, pendingId, meal);
    return { success: true, meal };
  }

  /**
   * Discard a pending meal. Removes from storage.
   */
  static discardMeal(userId: string, pendingId: string): boolean {
    const meals = MealConfirmationService.getPendingMeals(userId);
    const filtered = meals.filter((m) => m.id !== pendingId);
    if (filtered.length === meals.length) return false;

    AppStorageRepository.savePendingMeals(userId, filtered);
    return true;
  }

  /**
   * Get all pending meals for a user (for review list UI).
   */
  static getPendingMeals(userId: string): PendingMeal[] {
    return AppStorageRepository.getPendingMeals(userId);
  }

  /**
   * Get a single pending meal by ID.
   */
  static getPendingMeal(userId: string, pendingId: string): PendingMeal | null {
    const meals = MealConfirmationService.getPendingMeals(userId);
    return meals.find((m) => m.id === pendingId) || null;
  }

  /**
   * Add a food item to a pending meal (for manual additions during review).
   */
  static addItemToPending(
    userId: string,
    pendingId: string,
    item: FoodItem
  ): PendingMeal | null {
    const pending = MealConfirmationService.getPendingMeal(userId, pendingId);
    if (!pending) return null;

    pending.items.push(item);
    pending.totalCalories = pending.items.reduce((sum, it) => sum + it.calories, 0);
    pending.totalProtein = Math.round(pending.items.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
    pending.totalCarbs = Math.round(pending.items.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
    pending.totalFat = Math.round(pending.items.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;

    MealConfirmationService.savePendingMeal(userId, pending);
    return pending;
  }

  /**
   * Remove a food item from a pending meal.
   */
  static removeItemFromPending(
    userId: string,
    pendingId: string,
    itemIndex: number
  ): PendingMeal | null {
    const pending = MealConfirmationService.getPendingMeal(userId, pendingId);
    if (!pending || itemIndex < 0 || itemIndex >= pending.items.length) return null;

    pending.items.splice(itemIndex, 1);
    pending.totalCalories = pending.items.reduce((sum, it) => sum + it.calories, 0);
    pending.totalProtein = Math.round(pending.items.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
    pending.totalCarbs = Math.round(pending.items.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
    pending.totalFat = Math.round(pending.items.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;

    MealConfirmationService.savePendingMeal(userId, pending);
    return pending;
  }

  /**
   * Update a single food item in a pending meal.
   */
  static updateItemInPending(
    userId: string,
    pendingId: string,
    itemIndex: number,
    updates: Partial<FoodItem>
  ): PendingMeal | null {
    const pending = MealConfirmationService.getPendingMeal(userId, pendingId);
    if (!pending || itemIndex < 0 || itemIndex >= pending.items.length) return null;

    pending.items[itemIndex] = { ...pending.items[itemIndex], ...updates };
    pending.totalCalories = pending.items.reduce((sum, it) => sum + it.calories, 0);
    pending.totalProtein = Math.round(pending.items.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
    pending.totalCarbs = Math.round(pending.items.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
    pending.totalFat = Math.round(pending.items.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;

    MealConfirmationService.savePendingMeal(userId, pending);
    return pending;
  }

  // ── Private Helpers ──

  private static convertToMeal(userId: string, pending: PendingMeal): Meal {
    return {
      id: 'meal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId,
      mealType: pending.mealType,
      loggedAt: pending.createdAt,
      items: pending.items,
      totalCalories: pending.totalCalories,
      totalProtein: pending.totalProtein,
      totalCarbs: pending.totalCarbs,
      totalFat: pending.totalFat,
      imageUrl: pending.imageUrl,
      aiAnalyzed: pending.source !== 'manual',
      aiConfidence: pending.confidence,
      userConfirmed: true,
      notes: pending.notes,
    };
  }

  private static logMealAndCleanup(
    userId: string,
    pendingId: string,
    meal: Meal
  ): void {
    // Log the meal using existing NutritionService
    const { NutritionService } = require('./nutrition');
    NutritionService.logMeal(userId, {
      mealType: meal.mealType,
      items: meal.items,
      totalCalories: meal.totalCalories,
      totalProtein: meal.totalProtein,
      totalCarbs: meal.totalCarbs,
      totalFat: meal.totalFat,
      imageUrl: meal.imageUrl,
      aiAnalyzed: meal.aiAnalyzed,
      aiConfidence: meal.aiConfidence,
      notes: meal.notes,
    });

    // Remove from pending meals
    MealConfirmationService.discardMeal(userId, pendingId);
  }

  private static savePendingMeal(userId: string, meal: PendingMeal): void {
    const meals = MealConfirmationService.getPendingMeals(userId);
    const idx = meals.findIndex((m) => m.id === meal.id);
    if (idx >= 0) {
      meals[idx] = meal;
    } else {
      meals.unshift(meal);
    }
    AppStorageRepository.savePendingMeals(userId, meals);
  }
}
