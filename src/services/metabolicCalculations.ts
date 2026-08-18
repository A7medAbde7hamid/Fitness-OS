import { ActivityLevel, PrimaryGoal, UnitSystem, UserProfile } from '../types';

export interface MetabolicCalculationInput {
  weightKg: number;
  heightCm: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birthYear?: number;
  age?: number;
  activityLevel: ActivityLevel;
  primaryGoal: PrimaryGoal;
  targetWeightKg?: number;
  targetDate?: string;
}

export interface MetabolicCalculationResult {
  bmr: number;
  tdee: number;
  dailyCaloricTarget: number;
  dailyProteinGrams: number;
  dailyCarbsGrams: number;
  dailyFatGrams: number;
  dailyStepTarget: number;
  dailyWaterMl: number;
  deficitOrSurplus: number;
  isSafe: boolean;
  warningMessageKey?: string;
  recommendedWeeksToGoal?: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const DEFAULT_STEP_TARGETS: Record<ActivityLevel, number> = {
  sedentary: 6000,
  lightly_active: 8000,
  moderately_active: 10000,
  very_active: 12000,
  extra_active: 15000,
};

/**
 * Calculates Mifflin-St Jeor Basal Metabolic Rate (BMR)
 * Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number = 28,
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' = 'male'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') {
    return Math.round(base - 161);
  }
  // male / other / default to male baseline +5
  return Math.round(base + 5);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

export function calculateMetabolicTargets(input: MetabolicCalculationInput): MetabolicCalculationResult {
  const currentYear = new Date().getFullYear();
  const age = input.age || (input.birthYear ? currentYear - input.birthYear : 28);
  
  const bmr = calculateBMR(input.weightKg, input.heightCm, age, input.gender);
  const tdee = calculateTDEE(bmr, input.activityLevel);

  let caloricTarget = tdee;
  let deficitOrSurplus = 0;
  let isSafe = true;
  let warningMessageKey: string | undefined;

  switch (input.primaryGoal) {
    case 'fat_loss': {
      // Standard safe deficit is 20% of TDEE (approx 350-500 kcal)
      // Minimum calorie floor: 1200 kcal for women, 1500 kcal for men
      const rawDeficit = Math.round(tdee * 0.20);
      const minFloor = input.gender === 'female' ? 1250 : 1500;
      
      caloricTarget = Math.max(minFloor, tdee - rawDeficit);
      deficitOrSurplus = caloricTarget - tdee;

      // If user provided a target weight and target date, check rate of loss
      if (input.targetWeightKg && input.targetWeightKg < input.weightKg && input.targetDate) {
        const targetTime = new Date(input.targetDate).getTime();
        const nowTime = Date.now();
        const diffDays = Math.max(1, Math.round((targetTime - nowTime) / (1000 * 60 * 60 * 24)));
        const diffWeeks = diffDays / 7;
        const totalLossNeededKg = input.weightKg - input.targetWeightKg;
        const lossPerWeekKg = totalLossNeededKg / diffWeeks;

        // > 1.0 kg/week is considered aggressive and unsafe for general population
        if (lossPerWeekKg > 1.0) {
          isSafe = false;
          warningMessageKey = 'warningExtremeDeficit';
        }
      }
      break;
    }

    case 'muscle_gain': {
      // Clean surplus: 10% to 15% above TDEE (approx 200 - 350 kcal)
      const rawSurplus = Math.round(tdee * 0.12);
      caloricTarget = tdee + rawSurplus;
      deficitOrSurplus = rawSurplus;
      break;
    }

    case 'fitness_improvement': {
      // Eucaloric with slight high-protein bias
      caloricTarget = tdee;
      deficitOrSurplus = 0;
      break;
    }

    case 'general_wellness':
    default: {
      caloricTarget = tdee;
      deficitOrSurplus = 0;
      break;
    }
  }

  // Protein targets:
  // Fat loss: 2.0g to 2.2g / kg bodyweight
  // Muscle gain: 1.8g to 2.0g / kg bodyweight
  // Wellness / Fitness: 1.6g to 1.8g / kg bodyweight
  let proteinPerKg = 1.6;
  if (input.primaryGoal === 'fat_loss') proteinPerKg = 2.0;
  if (input.primaryGoal === 'muscle_gain') proteinPerKg = 1.9;

  const dailyProteinGrams = Math.round(input.weightKg * proteinPerKg);
  const proteinCalories = dailyProteinGrams * 4;

  // Fat target: 25% to 30% of total calories (minimum 0.7g/kg for hormonal health)
  const fatCalories = Math.round(caloricTarget * 0.25);
  const dailyFatGrams = Math.round(Math.max(input.weightKg * 0.7, fatCalories / 9));

  // Remaining calories to Carbohydrates
  const remainingCalories = Math.max(0, caloricTarget - (proteinCalories + (dailyFatGrams * 9)));
  const dailyCarbsGrams = Math.round(remainingCalories / 4);

  // Water target: 35ml per kg of bodyweight + activity buffer
  const dailyWaterMl = Math.round(input.weightKg * 38);

  const dailyStepTarget = DEFAULT_STEP_TARGETS[input.activityLevel] || 8000;

  // Recommended weeks to goal if target weight provided
  let recommendedWeeksToGoal: number | undefined;
  if (input.targetWeightKg && input.targetWeightKg !== input.weightKg) {
    const delta = Math.abs(input.weightKg - input.targetWeightKg);
    const safeRatePerWeek = input.primaryGoal === 'fat_loss' ? 0.5 : 0.25;
    recommendedWeeksToGoal = Math.ceil(delta / safeRatePerWeek);
  }

  return {
    bmr,
    tdee,
    dailyCaloricTarget: Math.round(caloricTarget),
    dailyProteinGrams,
    dailyCarbsGrams,
    dailyFatGrams,
    dailyStepTarget,
    dailyWaterMl,
    deficitOrSurplus,
    isSafe,
    warningMessageKey,
    recommendedWeeksToGoal,
  };
}

/**
 * Computes a 7-day rolling weight average from historical weight logs
 */
export function calculateRollingWeightAverage(weights: { weightKg: number; measuredAt: string }[]): number | null {
  if (!weights || weights.length === 0) return null;
  
  // Sort descending by date
  const sorted = [...weights].sort(
    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
  );
  
  const recent7 = sorted.slice(0, 7);
  const sum = recent7.reduce((acc, curr) => acc + curr.weightKg, 0);
  return Math.round((sum / recent7.length) * 10) / 10;
}
