import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DailyCheckInService } from '../dailyCheckIn';

// Mock IndexedDB
const mockCheckIns: Record<string, any[]> = {};

vi.mock('../../db/indexedDb', () => ({
  IndexedDBRepository: {
    getCheckIns: vi.fn(async (userId: string) => mockCheckIns[userId] || []),
    getCheckInByDate: vi.fn(async (userId: string, date: string) => {
      return (mockCheckIns[userId] || []).find((c) => c.date === date);
    }),
    saveCheckIn: vi.fn(async (checkIn: any) => {
      if (!mockCheckIns[checkIn.userId]) mockCheckIns[checkIn.userId] = [];
      const idx = mockCheckIns[checkIn.userId].findIndex((c) => c.date === checkIn.date);
      if (idx >= 0) {
        mockCheckIns[checkIn.userId][idx] = checkIn;
      } else {
        mockCheckIns[checkIn.userId].push(checkIn);
      }
    }),
  },
}));

describe('DailyCheckInService', () => {
  beforeEach(() => {
    Object.keys(mockCheckIns).forEach((k) => delete mockCheckIns[k]);
    vi.clearAllMocks();
  });

  it('saves a check-in', async () => {
    const checkIn = await DailyCheckInService.saveCheckIn(
      'user_1', '2025-01-15', 'good', 'high', 'normal', 'excellent', 'Felt great'
    );
    expect(checkIn.id).toBeDefined();
    expect(checkIn.feeling).toBe('good');
    expect(checkIn.energy).toBe('high');
    expect(checkIn.hunger).toBe('normal');
    expect(checkIn.sleep).toBe('excellent');
    expect(checkIn.note).toBe('Felt great');
  });

  it('updates existing check-in for same date', async () => {
    await DailyCheckInService.saveCheckIn(
      'user_1', '2025-01-15', 'good', 'high', 'normal', 'excellent'
    );
    const updated = await DailyCheckInService.saveCheckIn(
      'user_1', '2025-01-15', 'great', 'high', 'normal', 'excellent'
    );
    expect(updated.feeling).toBe('great');
  });

  it('retrieves check-in by date', async () => {
    await DailyCheckInService.saveCheckIn(
      'user_1', '2025-01-15', 'good', 'high', 'normal', 'excellent'
    );
    const checkIn = await DailyCheckInService.getCheckIn('user_1', '2025-01-15');
    expect(checkIn).toBeDefined();
    expect(checkIn?.feeling).toBe('good');
  });

  it('returns undefined for non-existent date', async () => {
    const checkIn = await DailyCheckInService.getCheckIn('user_1', '2025-01-15');
    expect(checkIn).toBeUndefined();
  });

  it('checks if user has checked in today', async () => {
    const today = new Date().toISOString().split('T')[0];
    await DailyCheckInService.saveCheckIn(
      'user_1', today, 'good', 'high', 'normal', 'excellent'
    );
    const hasChecked = await DailyCheckInService.hasCheckedInToday('user_1');
    expect(hasChecked).toBe(true);
  });

  it('returns false when user has not checked in today', async () => {
    const hasChecked = await DailyCheckInService.hasCheckedInToday('user_1');
    expect(hasChecked).toBe(false);
  });

  it('gets recent check-ins within date range', async () => {
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(12, 0, 0, 0);
      await DailyCheckInService.saveCheckIn(
        'user_1', date.toISOString().split('T')[0], 'good', 'high', 'normal', 'excellent'
      );
    }

    const recent = await DailyCheckInService.getRecentCheckIns('user_1', 7);
    expect(recent.length).toBeGreaterThanOrEqual(7);
    expect(recent.length).toBeLessThanOrEqual(8);
  });

  it('returns correct labels for feeling levels', () => {
    expect(DailyCheckInService.getFeelingLabel('great', 'en')).toBe('Great');
    expect(DailyCheckInService.getFeelingLabel('great', 'ar')).toBe('ممتاز');
    expect(DailyCheckInService.getFeelingLabel('tired', 'en')).toBe('Tired');
  });

  it('returns correct labels for energy levels', () => {
    expect(DailyCheckInService.getEnergyLabel('high', 'en')).toBe('High');
    expect(DailyCheckInService.getEnergyLabel('high', 'ar')).toBe('عالي');
  });

  it('returns correct labels for hunger levels', () => {
    expect(DailyCheckInService.getHungerLabel('hungry', 'en')).toBe('Hungry');
    expect(DailyCheckInService.getHungerLabel('hungry', 'ar')).toBe('جائع');
  });

  it('returns correct labels for sleep quality', () => {
    expect(DailyCheckInService.getSleepLabel('excellent', 'en')).toBe('Excellent');
    expect(DailyCheckInService.getSleepLabel('excellent', 'ar')).toBe('ممتاز');
  });

  it('converts check-in to context string for AI', async () => {
    const checkIn = {
      id: '1',
      userId: 'user_1',
      date: '2025-01-15',
      feeling: 'good' as const,
      energy: 'high' as const,
      hunger: 'normal' as const,
      sleep: 'excellent' as const,
      note: 'Feeling motivated',
      createdAt: new Date().toISOString(),
    };

    const contextEn = DailyCheckInService.toContextString(checkIn, 'en');
    expect(contextEn).toContain('Good');
    expect(contextEn).toContain('High');
    expect(contextEn).toContain('Feeling motivated');

    const contextAr = DailyCheckInService.toContextString(checkIn, 'ar');
    expect(contextAr).toContain('جيد');
    expect(contextAr).toContain('عالي');
  });
});
