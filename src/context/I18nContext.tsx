import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { translations } from '../i18n/translations';
import { Direction, Language, UnitSystem } from '../types';
import { UnitConversionService, ConvertedWeight, ConvertedDistance, ConvertedHeight, ConvertedEnergy } from '../services/unitConversion';
import { AuthService } from '../services/auth';

export interface I18nContextType {
  language: Language;
  direction: Direction;
  isRTL: boolean;
  unitSystem: UnitSystem;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatWeight: (kg: number) => ConvertedWeight;
  formatHeight: (cm: number) => ConvertedHeight;
  formatDistance: (km: number) => ConvertedDistance;
  formatEnergy: (kcal: number) => ConvertedEnergy;
  formatPace: (durationMinutes: number, distanceKm: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'ai_fitness_os_lang';
const UNIT_SYSTEM_STORAGE_KEY = 'ai_fitness_os_unit_system';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const user = AuthService.getCurrentUser();
      if (user) {
        const profile = AuthService.getProfile(user.id);
        if (profile?.preferredLanguage) return profile.preferredLanguage;
      }
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {
      // fallback
    }
    return 'en';
  });

  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    try {
      const user = AuthService.getCurrentUser();
      if (user) {
        const profile = AuthService.getProfile(user.id);
        if (profile?.unitSystem) return profile.unitSystem;
      }
      const saved = localStorage.getItem(UNIT_SYSTEM_STORAGE_KEY) as UnitSystem;
      if (saved === 'metric' || saved === 'imperial') return saved;
    } catch {
      // fallback
    }
    return 'metric';
  });

  // Sync preference changes when user profile is loaded or authenticated
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user, profile) => {
      if (profile) {
        if (profile.preferredLanguage && (profile.preferredLanguage === 'en' || profile.preferredLanguage === 'ar')) {
          setLanguageState(profile.preferredLanguage);
        }
        if (profile.unitSystem && (profile.unitSystem === 'metric' || profile.unitSystem === 'imperial')) {
          setUnitSystemState(profile.unitSystem);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  // Apply DOM attributes and class changes on language/direction switch
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (e) {
      console.error('Failed to save language preference', e);
    }

    // Update document & body language and direction attributes
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    document.documentElement.setAttribute('data-lang', language);
    document.documentElement.setAttribute('data-dir', direction);
    document.body.setAttribute('data-direction', direction);

    if (language === 'ar') {
      document.body.classList.add('font-arabic');
      document.body.classList.remove('font-sans');
    } else {
      document.body.classList.add('font-sans');
      document.body.classList.remove('font-arabic');
    }
  }, [language, direction]);

  useEffect(() => {
    try {
      localStorage.setItem(UNIT_SYSTEM_STORAGE_KEY, unitSystem);
    } catch (e) {
      console.error('Failed to save unit system preference', e);
    }
  }, [unitSystem]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      const user = AuthService.getCurrentUser();
      if (user) {
        const profile = AuthService.getProfile(user.id);
        if (profile && profile.preferredLanguage !== lang) {
          AuthService.saveProfile({
            ...profile,
            preferredLanguage: lang,
          });
        }
      }
    } catch (e) {
      console.error('Error persisting language preference:', e);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const nextLang = prev === 'en' ? 'ar' : 'en';
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
        const user = AuthService.getCurrentUser();
        if (user) {
          const profile = AuthService.getProfile(user.id);
          if (profile) {
            AuthService.saveProfile({
              ...profile,
              preferredLanguage: nextLang,
            });
          }
        }
      } catch (e) {
        console.error('Error persisting toggled language:', e);
      }
      return nextLang;
    });
  }, []);

  const setUnitSystem = useCallback((system: UnitSystem) => {
    setUnitSystemState(system);
    try {
      localStorage.setItem(UNIT_SYSTEM_STORAGE_KEY, system);
      const user = AuthService.getCurrentUser();
      if (user) {
        const profile = AuthService.getProfile(user.id);
        if (profile && profile.unitSystem !== system) {
          AuthService.saveProfile({
            ...profile,
            unitSystem: system,
          });
        }
      }
    } catch (e) {
      console.error('Error persisting unit system:', e);
    }
  }, []);

  const toggleUnitSystem = useCallback(() => {
    setUnitSystemState((prev) => {
      const nextSystem = prev === 'metric' ? 'imperial' : 'metric';
      try {
        localStorage.setItem(UNIT_SYSTEM_STORAGE_KEY, nextSystem);
        const user = AuthService.getCurrentUser();
        if (user) {
          const profile = AuthService.getProfile(user.id);
          if (profile) {
            AuthService.saveProfile({
              ...profile,
              unitSystem: nextSystem,
            });
          }
        }
      } catch (e) {
        console.error('Error persisting toggled unit system:', e);
      }
      return nextSystem;
    });
  }, []);

  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if missing in selected language
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: any = translations.en;
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    if (params) {
      let interpolated = current;
      for (const [paramKey, paramVal] of Object.entries(params)) {
        interpolated = interpolated.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }
      return interpolated;
    }

    return current;
  }, [language]);

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions): string => {
    try {
      const locale = language === 'ar' ? 'ar-EG' : 'en-US';
      return new Intl.NumberFormat(locale, options).format(num);
    } catch {
      return String(num);
    }
  }, [language]);

  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      const locale = language === 'ar' ? 'ar-EG' : 'en-US';
      return new Intl.DateTimeFormat(locale, options || { dateStyle: 'medium' }).format(d);
    } catch {
      return String(date);
    }
  }, [language]);

  const formatWeight = useCallback((kg: number): ConvertedWeight => {
    return UnitConversionService.convertWeight(kg, unitSystem, language);
  }, [unitSystem, language]);

  const formatHeight = useCallback((cm: number): ConvertedHeight => {
    return UnitConversionService.convertHeight(cm, unitSystem, language);
  }, [unitSystem, language]);

  const formatDistance = useCallback((km: number): ConvertedDistance => {
    return UnitConversionService.convertDistance(km, unitSystem, language);
  }, [unitSystem, language]);

  const formatEnergy = useCallback((kcal: number): ConvertedEnergy => {
    return UnitConversionService.convertEnergy(kcal, false, language);
  }, [language]);

  const formatPace = useCallback((durationMinutes: number, distanceKm: number): string => {
    return UnitConversionService.formatPace(durationMinutes, distanceKm, unitSystem, language);
  }, [unitSystem, language]);

  const contextValue = useMemo<I18nContextType>(() => ({
    language,
    direction,
    isRTL,
    unitSystem,
    setLanguage,
    toggleLanguage,
    setUnitSystem,
    toggleUnitSystem,
    t,
    formatNumber,
    formatDate,
    formatWeight,
    formatHeight,
    formatDistance,
    formatEnergy,
    formatPace,
  }), [
    language,
    direction,
    isRTL,
    unitSystem,
    setLanguage,
    toggleLanguage,
    setUnitSystem,
    toggleUnitSystem,
    t,
    formatNumber,
    formatDate,
    formatWeight,
    formatHeight,
    formatDistance,
    formatEnergy,
    formatPace,
  ]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
