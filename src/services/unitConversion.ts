import { Language, UnitSystem } from '../types';

export interface ConvertedWeight {
  value: number;
  unit: string;
  formatted: string;
}

export interface ConvertedDistance {
  value: number;
  unit: string;
  formatted: string;
}

export interface ConvertedHeight {
  value: number;
  unit: string;
  feet?: number;
  inches?: number;
  formatted: string;
}

export interface ConvertedEnergy {
  value: number;
  unit: string;
  formatted: string;
}

/**
 * Unit Conversion & Formatting Utility Service
 * Provides bidirectional conversions for Weight, Height, Distance, Pace, and Energy
 */
export class UnitConversionService {
  // Conversion factors
  static readonly KG_TO_LBS = 2.20462262;
  static readonly LBS_TO_KG = 0.45359237;
  static readonly KM_TO_MILES = 0.621371;
  static readonly MILES_TO_KM = 1.60934;
  static readonly CM_TO_INCHES = 0.393701;
  static readonly INCHES_TO_CM = 2.54;
  static readonly KCAL_TO_KJ = 4.184;

  /**
   * Convert and format body weight
   */
  static convertWeight(
    weightKg: number,
    targetSystem: UnitSystem = 'metric',
    lang: Language = 'en'
  ): ConvertedWeight {
    const isImperial = targetSystem === 'imperial';
    const rawVal = isImperial ? weightKg * this.KG_TO_LBS : weightKg;
    const value = Math.round(rawVal * 10) / 10;
    const unit = isImperial ? (lang === 'ar' ? 'باوند' : 'lbs') : (lang === 'ar' ? 'كجم' : 'kg');
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    const formatted = `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${unit}`;

    return { value, unit, formatted };
  }

  /**
   * Convert input weight to standard KG for database storage
   */
  static normalizeWeightToKg(value: number, sourceSystem: UnitSystem): number {
    if (sourceSystem === 'imperial') {
      return Math.round(value * this.LBS_TO_KG * 100) / 100;
    }
    return Math.round(value * 100) / 100;
  }

  /**
   * Convert and format height
   */
  static convertHeight(
    heightCm: number,
    targetSystem: UnitSystem = 'metric',
    lang: Language = 'en'
  ): ConvertedHeight {
    const isImperial = targetSystem === 'imperial';
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';

    if (isImperial) {
      const totalInches = heightCm * this.CM_TO_INCHES;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      const formatted = `${feet}'${inches}"`;
      return { value: Math.round(totalInches * 10) / 10, unit: 'in', feet, inches, formatted };
    }

    const value = Math.round(heightCm);
    const unit = lang === 'ar' ? 'سم' : 'cm';
    const formatted = `${new Intl.NumberFormat(locale).format(value)} ${unit}`;
    return { value, unit, formatted };
  }

  /**
   * Convert input height to standard CM for database storage
   */
  static normalizeHeightToCm(feetOrCm: number, inches: number = 0, sourceSystem: UnitSystem): number {
    if (sourceSystem === 'imperial') {
      const totalInches = feetOrCm * 12 + inches;
      return Math.round(totalInches * this.INCHES_TO_CM * 10) / 10;
    }
    return Math.round(feetOrCm * 10) / 10;
  }

  /**
   * Convert and format distance (km / miles)
   */
  static convertDistance(
    distanceKm: number,
    targetSystem: UnitSystem = 'metric',
    lang: Language = 'en'
  ): ConvertedDistance {
    const isImperial = targetSystem === 'imperial';
    const rawVal = isImperial ? distanceKm * this.KM_TO_MILES : distanceKm;
    const value = Math.round(rawVal * 100) / 100;
    const unit = isImperial ? (lang === 'ar' ? 'ميل' : 'mi') : (lang === 'ar' ? 'كم' : 'km');
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    const formatted = `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value)} ${unit}`;

    return { value, unit, formatted };
  }

  /**
   * Convert input distance to standard KM for storage
   */
  static normalizeDistanceToKm(value: number, sourceSystem: UnitSystem): number {
    if (sourceSystem === 'imperial') {
      return Math.round(value * this.MILES_TO_KM * 100) / 100;
    }
    return Math.round(value * 100) / 100;
  }

  /**
   * Convert and format energy/calories (kcal or kJ)
   */
  static convertEnergy(
    kcal: number,
    asKiloJoules: boolean = false,
    lang: Language = 'en'
  ): ConvertedEnergy {
    const value = asKiloJoules ? Math.round(kcal * this.KCAL_TO_KJ) : Math.round(kcal);
    const unit = asKiloJoules
      ? (lang === 'ar' ? 'كيلو جول' : 'kJ')
      : (lang === 'ar' ? 'سعرة' : 'kcal');
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    const formatted = `${new Intl.NumberFormat(locale).format(value)} ${unit}`;

    return { value, unit, formatted };
  }

  /**
   * Format pace (min/km or min/mi)
   */
  static formatPace(
    durationMinutes: number,
    distanceKm: number,
    targetSystem: UnitSystem = 'metric',
    lang: Language = 'en'
  ): string {
    if (!distanceKm || distanceKm <= 0) return '--:--';
    const dist = targetSystem === 'imperial' ? distanceKm * this.KM_TO_MILES : distanceKm;
    const paceDecimal = durationMinutes / dist;
    const minutes = Math.floor(paceDecimal);
    const seconds = Math.round((paceDecimal - minutes) * 60);
    const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    const unit = targetSystem === 'imperial'
      ? (lang === 'ar' ? 'د/ميل' : '/mi')
      : (lang === 'ar' ? 'د/كم' : '/km');

    return `${minutes}:${secStr} ${unit}`;
  }
}
