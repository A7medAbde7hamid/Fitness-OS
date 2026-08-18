/**
 * Food Analysis Service
 * Client-side service that sends images/descriptions to the server-side Gemini Vision endpoint.
 * Validates all Gemini responses with Zod before returning to UI.
 * Gemini estimates are treated as estimates — user must be able to edit/confirm/discard.
 */

import { z } from 'zod';
import { FoodItem } from '../types';
import { ImageProcessingService, ProcessedImage } from './imageProcessingService';

// ── Zod Schemas for Gemini Response Validation ──

export const GeminiFoodItemSchema = z.object({
  name: z.string().min(1, 'Food name is required'),
  portion: z.string().min(1, 'Portion description is required'),
  grams: z.number().min(0).max(10000),
  calories: z.number().min(0).max(50000),
  protein: z.number().min(0).max(5000),
  carbs: z.number().min(0).max(5000),
  fat: z.number().min(0).max(5000),
  confidence: z.number().min(0).max(1),
});

export const GeminiFoodAnalysisResponseSchema = z.object({
  items: z.array(GeminiFoodItemSchema).min(1, 'At least one food item required'),
  totalCalories: z.number().min(0),
  totalProtein: z.number().min(0),
  totalCarbs: z.number().min(0),
  totalFat: z.number().min(0),
  confidence: z.number().min(0).max(1),
});

export type GeminiFoodAnalysisResponse = z.infer<typeof GeminiFoodAnalysisResponseSchema>;

// ── Confidence Levels ──

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceInfo {
  level: ConfidenceLevel;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  color: string; // tailwind color class
  requiresConfirmation: boolean;
  autoConfirm: boolean;
}

export const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceInfo> = {
  high: {
    level: 'high',
    label: 'High Confidence',
    labelAr: 'ثقة عالية',
    description: 'Analysis looks accurate. You can confirm directly.',
    descriptionAr: 'يبدو التحليل دقيقاً. يمكنك التأكيد مباشرة.',
    color: 'text-emerald-400',
    requiresConfirmation: false,
    autoConfirm: true,
  },
  medium: {
    level: 'medium',
    label: 'Review Portions',
    labelAr: 'راجع الكميات',
    description: 'Please review the portions before confirming.',
    descriptionAr: 'يرجى مراجعة الكميات قبل التأكيد.',
    color: 'text-amber-400',
    requiresConfirmation: true,
    autoConfirm: false,
  },
  low: {
    level: 'low',
    label: 'Needs Clarification',
    labelAr: 'يحتاج توضيح',
    description: 'Could not identify food clearly. Please edit or enter manually.',
    descriptionAr: 'تعذر التعرف على الطعام بوضوح. يرجى التعديل أو الإدخال يدوياً.',
    color: 'text-rose-400',
    requiresConfirmation: true,
    autoConfirm: false,
  },
};

// ── Analysis Result Types ──

export interface FoodAnalysisResult {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  source: 'gemini_vision' | 'text_parse' | 'manual';
  imageUrl?: string;
}

export interface AnalysisRequest {
  description?: string;
  image?: ProcessedImage;
  imageBase64?: string;
  language: 'en' | 'ar';
}

// ── Food Analysis Service ──

export class FoodAnalysisService {
  /**
   * Analyze food from an image (Gemini Vision multimodal).
   * Sends compressed image to server endpoint, validates response with Zod.
   */
  static async analyzeFromImage(
    image: ProcessedImage,
    language: 'en' | 'ar' = 'en'
  ): Promise<FoodAnalysisResult> {
    const imageBase64 = ImageProcessingService.toBase64(image);

    const response = await fetch('/api/ai/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType: image.mimeType,
        language,
        mode: 'image',
      }),
    });

    if (!response.ok) {
      throw new Error(`Food analysis failed: ${response.status}`);
    }

    const raw = await response.json();
    return FoodAnalysisService.validateAndBuildResult(raw, 'gemini_vision', image.dataUrl);
  }

  /**
   * Analyze food from a text description.
   * Tries Gemini first, falls back to local parse, then manual estimate.
   */
  static async analyzeFromDescription(
    description: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<FoodAnalysisResult> {
    // Try server-side Gemini analysis
    try {
      const response = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          language,
          mode: 'text',
        }),
      });

      if (response.ok) {
        const raw = await response.json();
        return FoodAnalysisService.validateAndBuildResult(raw, 'gemini_vision');
      }
    } catch (err) {
      console.warn('Gemini text analysis failed, falling back to local parse:', err);
    }

    // Fallback: use existing local NutritionService parser
    const { NutritionService } = await import('./nutrition');
    const parsed = NutritionService.parseMealDescription(description, language);

    return {
      items: parsed.items,
      totalCalories: parsed.totalCalories,
      totalProtein: parsed.totalProtein,
      totalCarbs: parsed.totalCarbs,
      totalFat: parsed.totalFat,
      confidence: parsed.confidence,
      confidenceLevel: FoodAnalysisService.classifyConfidence(parsed.confidence),
      source: 'text_parse',
    };
  }

  /**
   * Combined analysis: image + optional text description.
   * If both provided, text is used to enhance the image analysis context.
   */
  static async analyzeCombined(
    image: ProcessedImage,
    description: string | undefined,
    language: 'en' | 'ar' = 'en'
  ): Promise<FoodAnalysisResult> {
    const imageBase64 = ImageProcessingService.toBase64(image);

    const response = await fetch('/api/ai/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType: image.mimeType,
        description,
        language,
        mode: 'combined',
      }),
    });

    if (!response.ok) {
      // Fallback to image-only or text-only
      if (description) {
        return FoodAnalysisService.analyzeFromDescription(description, language);
      }
      throw new Error(`Combined food analysis failed: ${response.status}`);
    }

    const raw = await response.json();
    return FoodAnalysisService.validateAndBuildResult(raw, 'gemini_vision', image.dataUrl);
  }

  /**
   * Validate Gemini response with Zod and build a FoodAnalysisResult.
   * If validation fails, returns a low-confidence fallback.
   */
  static validateAndBuildResult(
    raw: unknown,
    source: FoodAnalysisResult['source'],
    imageUrl?: string
  ): FoodAnalysisResult {
    const result = GeminiFoodAnalysisResponseSchema.safeParse(raw);

    if (!result.success) {
      console.warn('Gemini response validation failed:', result.error.flatten());
      return FoodAnalysisService.buildFallbackResult(source, imageUrl);
    }

    const data = result.data;
    const avgConfidence =
      data.items.reduce((sum, item) => sum + item.confidence, 0) / data.items.length;

    const items: FoodItem[] = data.items.map((item) => ({
      name: item.name,
      portion: item.portion,
      grams: item.grams,
      calories: Math.round(item.calories),
      protein: Math.round(item.protein * 10) / 10,
      carbs: Math.round(item.carbs * 10) / 10,
      fat: Math.round(item.fat * 10) / 10,
      confidence: Math.round(item.confidence * 100) / 100,
    }));

    return {
      items,
      totalCalories: Math.round(data.totalCalories),
      totalProtein: Math.round(data.totalProtein * 10) / 10,
      totalCarbs: Math.round(data.totalCarbs * 10) / 10,
      totalFat: Math.round(data.totalFat * 10) / 10,
      confidence: Math.round(avgConfidence * 100) / 100,
      confidenceLevel: FoodAnalysisService.classifyConfidence(avgConfidence),
      source,
      imageUrl,
    };
  }

  /**
   * Classify a confidence score (0-1) into a level.
   */
  static classifyConfidence(score: number): ConfidenceLevel {
    if (score >= 0.85) return 'high';
    if (score >= 0.60) return 'medium';
    return 'low';
  }

  /**
   * Get the ConfidenceInfo for a given level.
   */
  static getConfidenceInfo(level: ConfidenceLevel): ConfidenceInfo {
    return CONFIDENCE_LEVELS[level];
  }

  /**
   * Build a low-confidence fallback result when analysis fails.
   */
  private static buildFallbackResult(
    source: FoodAnalysisResult['source'],
    imageUrl?: string
  ): FoodAnalysisResult {
    return {
      items: [
        {
          name: 'Unknown Meal',
          portion: '1 serving',
          grams: 300,
          calories: 400,
          protein: 30,
          carbs: 40,
          fat: 14,
          confidence: 0.5,
        },
      ],
      totalCalories: 400,
      totalProtein: 30,
      totalCarbs: 40,
      totalFat: 14,
      confidence: 0.5,
      confidenceLevel: 'low',
      source,
      imageUrl,
    };
  }
}
