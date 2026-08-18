import { describe, it, expect, beforeEach } from 'vitest';
import {
  FoodAnalysisService,
  GeminiFoodAnalysisResponseSchema,
  CONFIDENCE_LEVELS,
} from '../foodAnalysisService';

describe('FoodAnalysisService', () => {
  describe('classifyConfidence', () => {
    it('returns high for scores >= 0.85', () => {
      expect(FoodAnalysisService.classifyConfidence(0.85)).toBe('high');
      expect(FoodAnalysisService.classifyConfidence(0.95)).toBe('high');
      expect(FoodAnalysisService.classifyConfidence(1.0)).toBe('high');
    });

    it('returns medium for scores 0.60-0.84', () => {
      expect(FoodAnalysisService.classifyConfidence(0.60)).toBe('medium');
      expect(FoodAnalysisService.classifyConfidence(0.75)).toBe('medium');
      expect(FoodAnalysisService.classifyConfidence(0.84)).toBe('medium');
    });

    it('returns low for scores < 0.60', () => {
      expect(FoodAnalysisService.classifyConfidence(0.59)).toBe('low');
      expect(FoodAnalysisService.classifyConfidence(0.3)).toBe('low');
      expect(FoodAnalysisService.classifyConfidence(0.0)).toBe('low');
    });
  });

  describe('validateAndBuildResult', () => {
    it('builds result from valid Gemini response', () => {
      const raw = {
        items: [
          { name: 'Grilled Chicken', portion: '200g', grams: 200, calories: 330, protein: 62, carbs: 0, fat: 7.2, confidence: 0.92 },
        ],
        totalCalories: 330,
        totalProtein: 62,
        totalCarbs: 0,
        totalFat: 7.2,
        confidence: 0.92,
      };

      const result = FoodAnalysisService.validateAndBuildResult(raw, 'gemini_vision');

      expect(result.source).toBe('gemini_vision');
      expect(result.totalCalories).toBe(330);
      expect(result.totalProtein).toBe(62);
      expect(result.confidenceLevel).toBe('high');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Grilled Chicken');
    });

    it('returns low-confidence fallback for invalid response', () => {
      const raw = { invalid: 'data' };

      const result = FoodAnalysisService.validateAndBuildResult(raw, 'gemini_vision');

      expect(result.confidenceLevel).toBe('low');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Unknown Meal');
      expect(result.source).toBe('gemini_vision');
    });

    it('handles response with missing confidence field', () => {
      const raw = {
        items: [
          { name: 'Rice', portion: '1 cup', grams: 160, calories: 208, protein: 4.3, carbs: 45.1, fat: 0.5, confidence: 0.88 },
        ],
        totalCalories: 208,
        totalProtein: 4.3,
        totalCarbs: 45.1,
        totalFat: 0.5,
        confidence: 0.88,
      };

      const result = FoodAnalysisService.validateAndBuildResult(raw, 'text_parse');

      expect(result.source).toBe('text_parse');
      expect(result.confidenceLevel).toBe('high');
      expect(result.totalCalories).toBe(208);
    });

    it('rounds macro values correctly', () => {
      const raw = {
        items: [
          { name: 'Test', portion: '1', grams: 100, calories: 100, protein: 10.56, carbs: 20.34, fat: 5.78, confidence: 0.9 },
        ],
        totalCalories: 100,
        totalProtein: 10.56,
        totalCarbs: 20.34,
        totalFat: 5.78,
        confidence: 0.9,
      };

      const result = FoodAnalysisService.validateAndBuildResult(raw, 'manual');

      expect(result.items[0].protein).toBe(10.6);
      expect(result.items[0].carbs).toBe(20.3);
      expect(result.items[0].fat).toBe(5.8);
    });
  });

  describe('getConfidenceInfo', () => {
    it('returns correct info for each level', () => {
      const high = FoodAnalysisService.getConfidenceInfo('high');
      expect(high.autoConfirm).toBe(true);
      expect(high.requiresConfirmation).toBe(false);
      expect(high.color).toContain('emerald');

      const medium = FoodAnalysisService.getConfidenceInfo('medium');
      expect(medium.autoConfirm).toBe(false);
      expect(medium.requiresConfirmation).toBe(true);

      const low = FoodAnalysisService.getConfidenceInfo('low');
      expect(low.autoConfirm).toBe(false);
      expect(low.requiresConfirmation).toBe(true);
      expect(low.color).toContain('rose');
    });
  });

  describe('GeminiFoodAnalysisResponseSchema (Zod)', () => {
    it('accepts valid response', () => {
      const result = GeminiFoodAnalysisResponseSchema.safeParse({
        items: [{ name: 'Food', portion: '1', grams: 100, calories: 200, protein: 20, carbs: 30, fat: 5, confidence: 0.9 }],
        totalCalories: 200,
        totalProtein: 20,
        totalCarbs: 30,
        totalFat: 5,
        confidence: 0.9,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty items array', () => {
      const result = GeminiFoodAnalysisResponseSchema.safeParse({
        items: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        confidence: 0.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative calories', () => {
      const result = GeminiFoodAnalysisResponseSchema.safeParse({
        items: [{ name: 'Food', portion: '1', grams: 100, calories: -50, protein: 20, carbs: 30, fat: 5, confidence: 0.9 }],
        totalCalories: -50,
        totalProtein: 20,
        totalCarbs: 30,
        totalFat: 5,
        confidence: 0.9,
      });
      expect(result.success).toBe(false);
    });

    it('rejects confidence > 1', () => {
      const result = GeminiFoodAnalysisResponseSchema.safeParse({
        items: [{ name: 'Food', portion: '1', grams: 100, calories: 200, protein: 20, carbs: 30, fat: 5, confidence: 1.5 }],
        totalCalories: 200,
        totalProtein: 20,
        totalCarbs: 30,
        totalFat: 5,
        confidence: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });
});
