export interface NotificationPreferences {
  userId: string;
  dailyCheckin: { enabled: boolean; preferredTime: string; timezone: string };
  workoutReminder: { enabled: boolean; preferredTime: string; timezone: string };
  weighInReminder: { enabled: boolean; preferredTime: string; timezone: string };
  weeklyReport: { enabled: boolean; preferredTime: string; timezone: string };
}

const STORAGE_KEY = 'ai_fitness_os_notification_prefs_';
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export class NotificationPreferencesService {
  static getDefault(userId: string): NotificationPreferences {
    return {
      userId,
      dailyCheckin: { enabled: true, preferredTime: '08:00', timezone: DEFAULT_TIMEZONE },
      workoutReminder: { enabled: true, preferredTime: '17:00', timezone: DEFAULT_TIMEZONE },
      weighInReminder: { enabled: true, preferredTime: '07:00', timezone: DEFAULT_TIMEZONE },
      weeklyReport: { enabled: true, preferredTime: '09:00', timezone: DEFAULT_TIMEZONE },
    };
  }

  static get(userId: string): NotificationPreferences {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}${userId}`);
      if (data) {
        return JSON.parse(data) as NotificationPreferences;
      }
    } catch {
      return this.getDefault(userId);
    }
    return this.getDefault(userId);
  }

  static save(userId: string, prefs: NotificationPreferences): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}${userId}`, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save notification preferences', e);
    }
  }

  static update(userId: string, updates: Partial<NotificationPreferences>): NotificationPreferences {
    const current = this.get(userId);
    const merged: NotificationPreferences = {
      ...current,
      ...updates,
      dailyCheckin: { ...current.dailyCheckin, ...updates.dailyCheckin },
      workoutReminder: { ...current.workoutReminder, ...updates.workoutReminder },
      weighInReminder: { ...current.weighInReminder, ...updates.weighInReminder },
      weeklyReport: { ...current.weeklyReport, ...updates.weeklyReport },
    };
    this.save(userId, merged);
    return merged;
  }
}
