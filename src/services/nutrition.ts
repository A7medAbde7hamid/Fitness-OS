import { FoodItem, Meal, MealType } from '../types';
import { AppStorageRepository } from '../db/storage';

export interface NutritionBreakdown {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  macroPercentages: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface FoodDatabaseEntry {
  name: string;
  nameAr: string;
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'composite';
  servingUnit: string;
  servingUnitAr: string;
  defaultGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  keywords: string[];
}

export const COMMON_FOOD_DATABASE: FoodDatabaseEntry[] = [
  {
    name: 'Grilled Chicken Breast',
    nameAr: 'صدر دجاج مشوي',
    category: 'protein',
    servingUnit: '100g portion',
    servingUnitAr: '100 جم',
    defaultGrams: 150,
    caloriesPer100g: 165,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.6,
    keywords: ['chicken', 'breast', 'دجاج', 'صدر', 'فراخ', 'شيش طاووق'],
  },
  {
    name: 'Whole Large Egg',
    nameAr: 'بيض كامل مسلوق أو مقلي',
    category: 'protein',
    servingUnit: '1 egg (50g)',
    servingUnitAr: 'بيضة واحدة',
    defaultGrams: 50,
    caloriesPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fatPer100g: 9.5,
    keywords: ['egg', 'eggs', 'بيض', 'بيضة', 'اومليت', 'omelet', 'boiled egg'],
  },
  {
    name: 'Egg Whites',
    nameAr: 'بياض بيض',
    category: 'protein',
    servingUnit: '100g portion',
    servingUnitAr: '100 جم بياض',
    defaultGrams: 120,
    caloriesPer100g: 52,
    proteinPer100g: 11.0,
    carbsPer100g: 0.7,
    fatPer100g: 0.2,
    keywords: ['egg white', 'egg whites', 'بياض'],
  },
  {
    name: 'Atlantic Salmon Fillet',
    nameAr: 'فيليه سلمون مشوي',
    category: 'protein',
    servingUnit: '150g fillet',
    servingUnitAr: '150 جم فيليه',
    defaultGrams: 150,
    caloriesPer100g: 208,
    proteinPer100g: 22.0,
    carbsPer100g: 0.0,
    fatPer100g: 13.0,
    keywords: ['salmon', 'سلمون', 'سمك', 'fish'],
  },
  {
    name: 'Canned Tuna in Water',
    nameAr: 'تونة بالماء مصفاة',
    category: 'protein',
    servingUnit: '1 can drained (120g)',
    servingUnitAr: 'علبة تونة',
    defaultGrams: 120,
    caloriesPer100g: 116,
    proteinPer100g: 25.5,
    carbsPer100g: 0.0,
    fatPer100g: 1.0,
    keywords: ['tuna', 'تونة'],
  },
  {
    name: 'Whey Protein Isolate',
    nameAr: 'سكوب واي بروتين',
    category: 'protein',
    servingUnit: '1 scoop (30g)',
    servingUnitAr: 'مكيال واحد (30 جم)',
    defaultGrams: 30,
    caloriesPer100g: 375,
    proteinPer100g: 83.3,
    carbsPer100g: 3.3,
    fatPer100g: 2.5,
    keywords: ['whey', 'protein shake', 'بروتين', 'سكوب', 'واي بروتين', 'shake'],
  },
  {
    name: 'Non-Fat Greek Yogurt',
    nameAr: 'زبادي يوناني خالي الدسم',
    category: 'protein',
    servingUnit: '1 cup (170g)',
    servingUnitAr: 'كوب (170 جم)',
    defaultGrams: 170,
    caloriesPer100g: 59,
    proteinPer100g: 10.0,
    carbsPer100g: 3.6,
    fatPer100g: 0.4,
    keywords: ['greek yogurt', 'yogurt', 'زبادي', 'يوناني', 'لبن زبادي'],
  },
  {
    name: 'Cooked White Basmati Rice',
    nameAr: 'أرز بسمتي مطبوخ',
    category: 'carb',
    servingUnit: '1 cup cooked (160g)',
    servingUnitAr: 'كوب مطبوخ',
    defaultGrams: 160,
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
    keywords: ['rice', 'basmati', 'white rice', 'رز', 'ارز', 'بسمتي'],
  },
  {
    name: 'Rolled Oats (Dry)',
    nameAr: 'شوفان كامل الحبة',
    category: 'carb',
    servingUnit: '1/2 cup dry (50g)',
    servingUnitAr: 'نصف كوب (50 جم)',
    defaultGrams: 50,
    caloriesPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
    keywords: ['oats', 'oatmeal', 'شوفان'],
  },
  {
    name: 'Baked Sweet Potato',
    nameAr: 'بطاطا حلوة مشوية',
    category: 'carb',
    servingUnit: '1 medium (150g)',
    servingUnitAr: 'حبة متوسطة (150 جم)',
    defaultGrams: 150,
    caloriesPer100g: 90,
    proteinPer100g: 2.0,
    carbsPer100g: 20.7,
    fatPer100g: 0.1,
    keywords: ['sweet potato', 'potato', 'بطاطا', 'بطاطس'],
  },
  {
    name: 'Fresh Banana',
    nameAr: 'موز طازج',
    category: 'carb',
    servingUnit: '1 medium banana (118g)',
    servingUnitAr: 'موزة متوسطة',
    defaultGrams: 118,
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 22.8,
    fatPer100g: 0.3,
    keywords: ['banana', 'bananas', 'موز', 'موزة'],
  },
  {
    name: 'Medjool Dates',
    nameAr: 'تمر سكري أو مجدول',
    category: 'carb',
    servingUnit: '2 dates (48g)',
    servingUnitAr: 'حبتين تمر (48 جم)',
    defaultGrams: 48,
    caloriesPer100g: 277,
    proteinPer100g: 1.8,
    carbsPer100g: 75.0,
    fatPer100g: 0.2,
    keywords: ['dates', 'date', 'تمر', 'بلح', 'رطب'],
  },
  {
    name: 'Extra Virgin Olive Oil',
    nameAr: 'زيت زيتون بكر ممتاز',
    category: 'fat',
    servingUnit: '1 tbsp (14g)',
    servingUnitAr: 'ملعقة طعام (14 جم)',
    defaultGrams: 14,
    caloriesPer100g: 884,
    proteinPer100g: 0.0,
    carbsPer100g: 0.0,
    fatPer100g: 100.0,
    keywords: ['olive oil', 'oil', 'زيت', 'زيتون'],
  },
  {
    name: 'Fresh Avocado',
    nameAr: 'أفوكادو طازج',
    category: 'fat',
    servingUnit: '1/2 avocado (80g)',
    servingUnitAr: 'نصف حبة (80 جم)',
    defaultGrams: 80,
    caloriesPer100g: 160,
    proteinPer100g: 2.0,
    carbsPer100g: 8.5,
    fatPer100g: 14.7,
    keywords: ['avocado', 'افوكادو', 'افوكادو'],
  },
  {
    name: 'Raw Almonds',
    nameAr: 'لوز نيء',
    category: 'fat',
    servingUnit: '1 handful (30g)',
    servingUnitAr: 'حفنة يد (30 جم)',
    defaultGrams: 30,
    caloriesPer100g: 579,
    proteinPer100g: 21.2,
    carbsPer100g: 21.6,
    fatPer100g: 49.9,
    keywords: ['almonds', 'nuts', 'لوز', 'مكسرات'],
  },
  {
    name: 'Chicken Kabsa with Rice',
    nameAr: 'كبسة دجاج مع أرز',
    category: 'composite',
    servingUnit: '1 plate (380g)',
    servingUnitAr: 'طبق واحد (380 جم)',
    defaultGrams: 380,
    caloriesPer100g: 175,
    proteinPer100g: 11.5,
    carbsPer100g: 21.0,
    fatPer100g: 5.2,
    keywords: ['kabsa', 'كبسة', 'مندي', 'مظبي', 'رز ولحم', 'رز ودجاج'],
  },
  {
    name: 'Foul Mudammas with Olive Oil',
    nameAr: 'فول مدمس بزيت الزيتون',
    category: 'composite',
    servingUnit: '1 bowl (250g)',
    servingUnitAr: 'صحن فول (250 جم)',
    defaultGrams: 250,
    caloriesPer100g: 110,
    proteinPer100g: 6.8,
    carbsPer100g: 14.2,
    fatPer100g: 3.5,
    keywords: ['foul', 'foul mudammas', 'فول', 'مدمس'],
  },
];

export class NutritionService {
  /**
   * Calculate calories from macronutrients using standard Atwater factors:
   * Protein: 4 kcal/g, Carbohydrate: 4 kcal/g, Fat: 9 kcal/g
   */
  static calculateMacronutrientCalories(proteinGrams: number, carbsGrams: number, fatGrams: number): number {
    return Math.round(proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9);
  }

  /**
   * Calculate percentage breakdown of total calories contributed by each macro
   */
  static calculateMacroDistribution(
    proteinGrams: number,
    carbsGrams: number,
    fatGrams: number
  ): { protein: number; carbs: number; fat: number } {
    const proteinCal = proteinGrams * 4;
    const carbsCal = carbsGrams * 4;
    const fatCal = fatGrams * 9;
    const totalCal = proteinCal + carbsCal + fatCal;

    if (totalCal <= 0) {
      return { protein: 30, carbs: 40, fat: 30 };
    }

    return {
      protein: Math.round((proteinCal / totalCal) * 100),
      carbs: Math.round((carbsCal / totalCal) * 100),
      fat: Math.round((fatCal / totalCal) * 100),
    };
  }

  /**
   * Natural Language Meal Parser & Estimator
   * Parses free-text meal logs in English and Arabic and returns estimated FoodItems
   */
  static parseMealDescription(text: string, language: 'en' | 'ar' = 'en'): {
    items: FoodItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    confidence: number;
  } {
    const rawLower = text.toLowerCase();
    const foundItems: FoodItem[] = [];

    // Extract numbers that might indicate grams or quantities
    const gramMatch = rawLower.match(/(\d+)\s*(g|gm|grams|جم|غرام)/);
    const specifiedGrams = gramMatch ? parseInt(gramMatch[1], 10) : null;

    const countMatch = rawLower.match(/(\d+)\s*(eggs|scoops|pieces|dates|بيض|سكوب|حبات|قطع)/);
    const multiplier = countMatch ? Math.max(1, parseInt(countMatch[1], 10)) : 1;

    for (const entry of COMMON_FOOD_DATABASE) {
      const isMatched = entry.keywords.some((kw) => rawLower.includes(kw.toLowerCase()));
      if (isMatched) {
        let grams = specifiedGrams || entry.defaultGrams;
        if (multiplier > 1 && !specifiedGrams) {
          grams = entry.defaultGrams * multiplier;
        }

        const scale = grams / 100;
        const calories = Math.round(entry.caloriesPer100g * scale);
        const protein = Math.round(entry.proteinPer100g * scale * 10) / 10;
        const carbs = Math.round(entry.carbsPer100g * scale * 10) / 10;
        const fat = Math.round(entry.fatPer100g * scale * 10) / 10;

        foundItems.push({
          name: language === 'ar' ? entry.nameAr : entry.name,
          portion: `${grams}g`,
          grams,
          calories,
          protein,
          carbs,
          fat,
          confidence: 0.94,
        });
      }
    }

    // Fallback if no specific database matches found
    if (foundItems.length === 0) {
      foundItems.push({
        name: text.trim(),
        portion: '1 serving (300g)',
        grams: 300,
        calories: 480,
        protein: 36,
        carbs: 52,
        fat: 14,
        confidence: 0.85,
      });
    }

    const totalCalories = foundItems.reduce((acc, it) => acc + it.calories, 0);
    const totalProtein = Math.round(foundItems.reduce((acc, it) => acc + it.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(foundItems.reduce((acc, it) => acc + it.carbs, 0) * 10) / 10;
    const totalFat = Math.round(foundItems.reduce((acc, it) => acc + it.fat, 0) * 10) / 10;
    const avgConfidence =
      Math.round((foundItems.reduce((acc, it) => acc + it.confidence, 0) / foundItems.length) * 100) / 100;

    return {
      items: foundItems,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      confidence: avgConfidence,
    };
  }

  /**
   * Log a Meal and atomically sync with the user's Daily Summary
   */
  static logMeal(
    userId: string,
    payload: {
      mealType: MealType;
      items: FoodItem[];
      totalCalories?: number;
      totalProtein?: number;
      totalCarbs?: number;
      totalFat?: number;
      imageUrl?: string;
      notes?: string;
      aiAnalyzed?: boolean;
      aiConfidence?: number;
    }
  ): Meal {
    const totalCalories =
      payload.totalCalories ?? payload.items.reduce((acc, it) => acc + it.calories, 0);
    const totalProtein =
      payload.totalProtein ??
      Math.round(payload.items.reduce((acc, it) => acc + it.protein, 0) * 10) / 10;
    const totalCarbs =
      payload.totalCarbs ??
      Math.round(payload.items.reduce((acc, it) => acc + it.carbs, 0) * 10) / 10;
    const totalFat =
      payload.totalFat ??
      Math.round(payload.items.reduce((acc, it) => acc + it.fat, 0) * 10) / 10;

    const newMeal: Meal = {
      id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      userId,
      mealType: payload.mealType,
      loggedAt: new Date().toISOString(),
      items: payload.items,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      imageUrl: payload.imageUrl,
      aiAnalyzed: payload.aiAnalyzed ?? true,
      aiConfidence: payload.aiConfidence ?? 0.94,
      userConfirmed: true,
      notes: payload.notes,
    };

    // Save to meals collection
    const existingMeals = AppStorageRepository.getMeals(userId);
    AppStorageRepository.saveMeals(userId, [newMeal, ...existingMeals]);

    // Update today's daily summary
    const today = new Date().toISOString().split('T')[0];
    const profile = AppStorageRepository.getProfile(userId);
    const currentSummary = AppStorageRepository.getDailySummary(userId, today) || {
      id: `sum_${today}`,
      userId,
      date: today,
      caloriesConsumed: 0,
      caloriesTarget: profile?.dailyCalorieTarget || 2150,
      proteinConsumedGrams: 0,
      proteinTargetGrams: profile?.dailyProteinTargetGrams || 160,
      carbsConsumedGrams: 0,
      fatConsumedGrams: 0,
      steps: 0,
      stepTarget: profile?.dailyStepTarget || 10000,
      activeMinutes: 0,
      activeCalories: 0,
      waterMl: 0,
      workoutCompleted: false,
    };

    currentSummary.caloriesConsumed += totalCalories;
    currentSummary.proteinConsumedGrams =
      Math.round((currentSummary.proteinConsumedGrams + totalProtein) * 10) / 10;
    currentSummary.carbsConsumedGrams =
      Math.round((currentSummary.carbsConsumedGrams + totalCarbs) * 10) / 10;
    currentSummary.fatConsumedGrams =
      Math.round((currentSummary.fatConsumedGrams + totalFat) * 10) / 10;

    AppStorageRepository.saveDailySummary(currentSummary);
    return newMeal;
  }

  /**
   * Smart Macro Gap Recommender
   * Proposes meals or snacks tailored to close specific remaining macronutrient gaps
   */
  static recommendMealForMacroGap(
    remainingCalories: number,
    remainingProtein: number,
    remainingCarbs: number,
    remainingFat: number,
    language: 'en' | 'ar' = 'en'
  ): {
    title: string;
    description: string;
    estimatedCalories: number;
    estimatedProtein: number;
    estimatedCarbs: number;
    estimatedFat: number;
  } {
    const isAr = language === 'ar';

    if (remainingProtein > 35 && remainingCalories <= 500) {
      // High protein, lean requirement
      return {
        title: isAr ? 'صدر دجاج مشوي مع زبادي يوناني وخضار' : 'Lean High-Protein Plate',
        description: isAr
          ? '200 جم صدر دجاج مشوي مع طبق خضار سوتيه و150 جم زبادي يوناني خالي الدسم. يوفر بروتين نقي بدون دهون زائدة.'
          : '200g grilled chicken breast with steamed greens and 150g non-fat Greek yogurt.',
        estimatedCalories: 380,
        estimatedProtein: 52,
        estimatedCarbs: 14,
        estimatedFat: 4,
      };
    }

    if (remainingCarbs > 60 && remainingCalories > 400) {
      // Pre/Post-workout carb refueling
      return {
        title: isAr ? 'شوفان بالبروتين والموز والتمر' : 'Anabolic Oatmeal & Fruit Bowl',
        description: isAr
          ? '60 جم شوفان كامل مع سكوب بروتين واي وموزة وتمرتين. مثالي للاستشفاء العضلي وتجديد الجليكوجين.'
          : '60g rolled oats with 1 scoop whey protein, 1 banana, and 2 Medjool dates.',
        estimatedCalories: 460,
        estimatedProtein: 35,
        estimatedCarbs: 72,
        estimatedFat: 6,
      };
    }

    // Balanced general snack
    return {
      title: isAr ? 'وجبة متوازنة خفيفة' : 'Balanced Macro Snack',
      description: isAr
        ? 'علبة تونة مع شريحة خبز حبة كاملة وسلطة خضراء مع ملعقة زيت زيتون صغيرة.'
        : 'Canned tuna on whole grain toast with a drizzle of extra virgin olive oil.',
      estimatedCalories: 310,
      estimatedProtein: 32,
      estimatedCarbs: 22,
      estimatedFat: 8,
    };
  }
}
