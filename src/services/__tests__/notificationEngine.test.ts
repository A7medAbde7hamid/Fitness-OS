import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationEngine } from '../notificationEngine';
import { NotificationPreferences } from '../../types';

// Mock Notification API
const mockNotification = vi.fn();
Object.defineProperty(globalThis, 'Notification', {
  value: Object.assign(mockNotification, {
    permission: 'default' as NotificationPermission,
  }),
  writable: true,
  configurable: true,
});

// Mock ServiceWorkerRegistration
const mockShowNotification = vi.fn();
Object.defineProperty(globalThis, 'navigator', {
  value: {
    serviceWorker: {
      ready: Promise.resolve({
        showNotification: mockShowNotification,
      }),
    },
    onLine: true,
  },
  writable: true,
  configurable: true,
});

describe('NotificationEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets permission status', () => {
    const status = NotificationEngine.getPermissionStatus();
    expect(['granted', 'denied', 'default', 'unsupported']).toContain(status);
  });

  it('builds payload for daily check-in in English', () => {
    const payload = NotificationEngine.buildPayload('daily_checkin', 'en');
    expect(payload.title).toBe('Daily Check-in');
    expect(payload.body).toBeDefined();
    expect(payload.tag).toBe('ai-fitness-daily_checkin');
  });

  it('builds payload for daily check-in in Arabic', () => {
    const payload = NotificationEngine.buildPayload('daily_checkin', 'ar');
    expect(payload.title).toBe('تسجيل يومي');
  });

  it('builds payload for workout reminder', () => {
    const payload = NotificationEngine.buildPayload('workout_reminder', 'en', {
      workout: 'Upper Body day!',
    });
    expect(payload.title).toBe('Workout Reminder');
    expect(payload.body).toContain('Upper Body day!');
  });

  it('builds payload for weigh-in reminder', () => {
    const payload = NotificationEngine.buildPayload('weigh_in_reminder', 'en');
    expect(payload.title).toBe('Weigh-in Reminder');
  });

  it('builds payload for weekly report', () => {
    const payload = NotificationEngine.buildPayload('weekly_report', 'en');
    expect(payload.title).toBe('Weekly Report Ready');
  });

  it('checks if notification should be sent based on preferences', () => {
    const prefs: NotificationPreferences = {
      userId: 'user_1',
      dailyCheckin: { enabled: true, preferredTime: '08:00', timezone: 'UTC' },
      workoutReminder: { enabled: false, preferredTime: '17:00', timezone: 'UTC' },
      weighInReminder: { enabled: true, preferredTime: '07:00', timezone: 'UTC' },
      weeklyReport: { enabled: true, preferredTime: '09:00', timezone: 'UTC' },
    };

    expect(NotificationEngine.shouldSendNotification(prefs, 'daily_checkin')).toBe(true);
    expect(NotificationEngine.shouldSendNotification(prefs, 'workout_reminder')).toBe(false);
    expect(NotificationEngine.shouldSendNotification(prefs, 'weigh_in_reminder')).toBe(true);
    expect(NotificationEngine.shouldSendNotification(prefs, 'weekly_report')).toBe(true);
  });

  it('gets scheduled time from preferences', () => {
    const prefs: NotificationPreferences = {
      userId: 'user_1',
      dailyCheckin: { enabled: true, preferredTime: '08:00', timezone: 'UTC' },
      workoutReminder: { enabled: true, preferredTime: '17:30', timezone: 'UTC' },
      weighInReminder: { enabled: true, preferredTime: '07:00', timezone: 'UTC' },
      weeklyReport: { enabled: true, preferredTime: '09:00', timezone: 'UTC' },
    };

    expect(NotificationEngine.getScheduledTime(prefs, 'daily_checkin')).toBe('08:00');
    expect(NotificationEngine.getScheduledTime(prefs, 'workout_reminder')).toBe('17:30');
  });
});
