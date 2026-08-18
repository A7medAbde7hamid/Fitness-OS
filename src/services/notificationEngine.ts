import { NotificationType, NotificationPreferences, Language } from '../types';
import { NotificationPreferencesService } from './notificationPreferences';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  scheduledTime: string; // HH:mm
  lastFiredDate?: string;
}

let swRegistration: ServiceWorkerRegistration | null = null;

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  if ('serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.ready;
      return swRegistration;
    } catch {
      return null;
    }
  }
  return null;
}

export class NotificationEngine {
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.requestPermission();
  }

  static getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  static async sendNotification(payload: NotificationPayload): Promise<boolean> {
    const permission = this.getPermissionStatus();
    if (permission !== 'granted') return false;

    const reg = await getSWRegistration();
    if (reg) {
      try {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.svg',
          badge: payload.badge || '/icons/icon-96x96.svg',
          tag: payload.tag,
          data: payload.data,
        } as NotificationOptions);
        return true;
      } catch {
        // Fallback to basic Notification API
      }
    }

    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.svg',
      });
      return true;
    } catch {
      return false;
    }
  }

  static buildPayload(
    type: NotificationType,
    lang: Language,
    params?: Record<string, string>
  ): NotificationPayload {
    const titles: Record<NotificationType, { en: string; ar: string }> = {
      daily_checkin: { en: 'Daily Check-in', ar: 'تسجيل يومي' },
      workout_reminder: { en: 'Workout Reminder', ar: 'تذكير التمرين' },
      weigh_in_reminder: { en: 'Weigh-in Reminder', ar: 'تذكير weighing' },
      weekly_report: { en: 'Weekly Report Ready', ar: 'التقرير الأسبوعي جاهز' },
    };

    const bodies: Record<NotificationType, { en: string; ar: string }> = {
      daily_checkin: {
        en: 'How are you feeling today? Take a quick check-in.',
        ar: 'كيف تشعر اليوم؟ سجّل تقييمك السريع.',
      },
      workout_reminder: {
        en: params?.workout || "Time for your workout! Let's get moving.",
        ar: params?.workout || 'حان وقت تمرينك! يلا نتحرك.',
      },
      weigh_in_reminder: {
        en: "Don't forget to log your weight today.",
        ar: 'لا تنس تسجيل وزنك اليوم.',
      },
      weekly_report: {
        en: 'Your weekly progress report is ready. Tap to view.',
        ar: 'تقرير تقدمك الأسبوعي جاهز. اضغط للمشاهدة.',
      },
    };

    const title = titles[type][lang] || titles[type].en;
    const body = bodies[type][lang] || bodies[type].en;

    return {
      title,
      body,
      tag: `ai-fitness-${type}`,
      data: { type, url: '/' },
    };
  }

  static shouldSendNotification(prefs: NotificationPreferences, type: NotificationType): boolean {
    const pref = prefs[type === 'daily_checkin' ? 'dailyCheckin' :
      type === 'workout_reminder' ? 'workoutReminder' :
      type === 'weigh_in_reminder' ? 'weighInReminder' : 'weeklyReport'];
    return pref.enabled;
  }

  static getScheduledTime(prefs: NotificationPreferences, type: NotificationType): string {
    const pref = prefs[type === 'daily_checkin' ? 'dailyCheckin' :
      type === 'workout_reminder' ? 'workoutReminder' :
      type === 'weigh_in_reminder' ? 'weighInReminder' : 'weeklyReport'];
    return pref.preferredTime;
  }

  static async sendIfNeeded(
    userId: string,
    type: NotificationType,
    lang: Language
  ): Promise<boolean> {
    const prefs = NotificationPreferencesService.get(userId);
    if (!this.shouldSendNotification(prefs, type)) return false;

    const scheduledTime = this.getScheduledTime(prefs, type);
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);

    const diff = Math.abs(now.getTime() - scheduled.getTime());
    if (diff > 30 * 60 * 1000) return false; // 30 min window

    const payload = this.buildPayload(type, lang);
    return this.sendNotification(payload);
  }
}
