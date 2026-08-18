import { Language, UnitSystem } from '../types';

export function formatNumber(value: number, lang: Language, options?: Intl.NumberFormatOptions): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatWeight(kg: number, unitSystem: UnitSystem, lang: Language): string {
  if (unitSystem === 'imperial') {
    const lbs = Math.round(kg * 2.20462 * 10) / 10;
    const unit = lang === 'ar' ? 'باوند' : 'lbs';
    return `${formatNumber(lbs, lang, { maximumFractionDigits: 1 })} ${unit}`;
  }
  const unit = lang === 'ar' ? 'كجم' : 'kg';
  return `${formatNumber(kg, lang, { maximumFractionDigits: 1 })} ${unit}`;
}

export function formatHeight(cm: number, unitSystem: UnitSystem, lang: Language): string {
  if (unitSystem === 'imperial') {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  const unit = lang === 'ar' ? 'سم' : 'cm';
  return `${formatNumber(cm, lang)} ${unit}`;
}

export function formatCalories(kcal: number, lang: Language): string {
  const unit = lang === 'ar' ? 'سعرة' : 'kcal';
  return `${formatNumber(Math.round(kcal), lang)} ${unit}`;
}

export function formatGrams(grams: number, lang: Language): string {
  const unit = lang === 'ar' ? 'جم' : 'g';
  return `${formatNumber(Math.round(grams), lang)} ${unit}`;
}

export function formatDate(dateString: string | Date, lang: Language, format: 'short' | 'medium' | 'full' = 'medium'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  
  if (isNaN(date.getTime())) return '';

  if (format === 'short') {
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }
  if (format === 'full') {
    return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}
