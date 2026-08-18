import { DailyCheckIn, FeelingLevel, EnergyLevel, HungerLevel, SleepQuality, Language } from '../types';
import { IndexedDBRepository } from '../db/indexedDb';

function generateId(): string {
  return `checkin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export class DailyCheckInService {
  static async getCheckIn(userId: string, date: string): Promise<DailyCheckIn | undefined> {
    return IndexedDBRepository.getCheckInByDate(userId, date);
  }

  static async getCheckIns(userId: string): Promise<DailyCheckIn[]> {
    return IndexedDBRepository.getCheckIns(userId);
  }

  static async saveCheckIn(
    userId: string,
    date: string,
    feeling: FeelingLevel,
    energy: EnergyLevel,
    hunger: HungerLevel,
    sleep: SleepQuality,
    note?: string
  ): Promise<DailyCheckIn> {
    const existing = await this.getCheckIn(userId, date);
    const checkIn: DailyCheckIn = {
      id: existing?.id || generateId(),
      userId,
      date,
      feeling,
      energy,
      hunger,
      sleep,
      note,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await IndexedDBRepository.saveCheckIn(checkIn);
    return checkIn;
  }

  static async hasCheckedInToday(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const checkIn = await this.getCheckIn(userId, today);
    return !!checkIn;
  }

  static async getRecentCheckIns(userId: string, days: number = 7): Promise<DailyCheckIn[]> {
    const all = await this.getCheckIns(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return all
      .filter((c) => c.date >= cutoffStr)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  static getFeelingLabel(level: FeelingLevel, lang: Language): string {
    const labels: Record<FeelingLevel, { en: string; ar: string }> = {
      great: { en: 'Great', ar: 'ممتاز' },
      good: { en: 'Good', ar: 'جيد' },
      okay: { en: 'Okay', ar: 'مقبول' },
      tired: { en: 'Tired', ar: 'متعب' },
      bad: { en: 'Bad', ar: 'سيء' },
    };
    return labels[level][lang] || labels[level].en;
  }

  static getEnergyLabel(level: EnergyLevel, lang: Language): string {
    const labels: Record<EnergyLevel, { en: string; ar: string }> = {
      high: { en: 'High', ar: 'عالي' },
      medium: { en: 'Medium', ar: 'متوسط' },
      low: { en: 'Low', ar: 'منخفض' },
    };
    return labels[level][lang] || labels[level].en;
  }

  static getHungerLabel(level: HungerLevel, lang: Language): string {
    const labels: Record<HungerLevel, { en: string; ar: string }> = {
      very_hungry: { en: 'Very Hungry', ar: 'جائع جداً' },
      hungry: { en: 'Hungry', ar: 'جائع' },
      normal: { en: 'Normal', ar: 'عادي' },
      not_hungry: { en: 'Not Hungry', ar: 'لست جائعاً' },
    };
    return labels[level][lang] || labels[level].en;
  }

  static getSleepLabel(level: SleepQuality, lang: Language): string {
    const labels: Record<SleepQuality, { en: string; ar: string }> = {
      excellent: { en: 'Excellent', ar: 'ممتاز' },
      good: { en: 'Good', ar: 'جيد' },
      fair: { en: 'Fair', ar: 'مقبول' },
      poor: { en: 'Poor', ar: 'سيء' },
    };
    return labels[level][lang] || labels[level].en;
  }

  static toContextString(checkIn: DailyCheckIn, lang: Language): string {
    const feeling = this.getFeelingLabel(checkIn.feeling, lang);
    const energy = this.getEnergyLabel(checkIn.energy, lang);
    const hunger = this.getHungerLabel(checkIn.hunger, lang);
    const sleep = this.getSleepLabel(checkIn.sleep, lang);

    if (lang === 'ar') {
      return `المستخدم يشعر بـ${feeling}، الطاقة ${energy}، الجوع ${hunger}، جودة النوم ${sleep}${checkIn.note ? `، ملاحظة: ${checkIn.note}` : ''}`;
    }
    return `User feeling ${feeling}, energy ${energy}, hunger ${hunger}, sleep quality ${sleep}${checkIn.note ? `, note: ${checkIn.note}` : ''}`;
  }
}
