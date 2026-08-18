import { AppStorageRepository } from '../db/storage';
import { Goal, UserProfile } from '../types';

export type GoalCategory = Goal['category'];
export type GoalStatus = Goal['status'];

export interface CreateGoalParams {
  userId: string;
  title: string;
  category: GoalCategory;
  metricType: string;
  startValue: number;
  targetValue: number;
  targetDate: string;
  notes?: string;
}

export interface GoalHistoryEntry {
  goalId: string;
  action: 'created' | 'updated' | 'paused' | 'resumed' | 'completed' | 'abandoned';
  timestamp: string;
  details?: string;
}

const GOAL_HISTORY_KEY = 'ai_fitness_os_goal_history_';

function getGoalHistory(userId: string): GoalHistoryEntry[] {
  try {
    const data = localStorage.getItem(`${GOAL_HISTORY_KEY}${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveGoalHistory(userId: string, history: GoalHistoryEntry[]): void {
  localStorage.setItem(`${GOAL_HISTORY_KEY}${userId}`, JSON.stringify(history));
}

function addHistoryEntry(userId: string, entry: GoalHistoryEntry): void {
  const history = getGoalHistory(userId);
  history.unshift(entry);
  if (history.length > 100) history.length = 100;
  saveGoalHistory(userId, history);
}

export class GoalService {
  static getActiveGoal(userId: string): Goal | null {
    const goals = AppStorageRepository.getGoals(userId);
    return goals.find((g) => g.status === 'in_progress') || null;
  }

  static getAllGoals(userId: string): Goal[] {
    return AppStorageRepository.getGoals(userId);
  }

  static getGoalById(userId: string, goalId: string): Goal | null {
    const goals = AppStorageRepository.getGoals(userId);
    return goals.find((g) => g.id === goalId) || null;
  }

  static getGoalHistory(userId: string): GoalHistoryEntry[] {
    return getGoalHistory(userId);
  }

  static createGoal(params: CreateGoalParams): Goal {
    const goals = AppStorageRepository.getGoals(params.userId);
    const activeGoal = goals.find((g) => g.status === 'in_progress');

    if (activeGoal) {
      throw new Error('ACTIVE_GOAL_EXISTS');
    }

    const goal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      title: params.title,
      category: params.category,
      metricType: params.metricType,
      startValue: params.startValue,
      currentValue: params.startValue,
      targetValue: params.targetValue,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: params.targetDate,
      status: 'in_progress',
      notes: params.notes,
    };

    goals.unshift(goal);
    AppStorageRepository.saveGoals(params.userId, goals);

    addHistoryEntry(params.userId, {
      goalId: goal.id,
      action: 'created',
      timestamp: new Date().toISOString(),
      details: `Goal created: ${params.title} (${params.startValue} → ${params.targetValue})`,
    });

    return goal;
  }

  static updateGoalProgress(userId: string, goalId: string, currentValue: number): Goal | null {
    const goals = AppStorageRepository.getGoals(userId);
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx === -1) return null;

    goals[idx].currentValue = currentValue;

    if (goals[idx].category === 'weight') {
      const start = goals[idx].startValue;
      const target = goals[idx].targetValue;
      const diff = Math.abs(start - target);
      if (diff > 0) {
        const progress = Math.abs(start - currentValue);
        if (progress >= diff) {
          goals[idx].status = 'completed';
          addHistoryEntry(userId, {
            goalId,
            action: 'completed',
            timestamp: new Date().toISOString(),
            details: `Goal completed! Reached ${currentValue} (target: ${target})`,
          });
        }
      }
    }

    AppStorageRepository.saveGoals(userId, goals);
    return goals[idx];
  }

  static pauseGoal(userId: string, goalId: string): Goal | null {
    const goals = AppStorageRepository.getGoals(userId);
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx === -1 || goals[idx].status !== 'in_progress') return null;

    goals[idx].status = 'paused';
    AppStorageRepository.saveGoals(userId, goals);

    addHistoryEntry(userId, {
      goalId,
      action: 'paused',
      timestamp: new Date().toISOString(),
    });

    return goals[idx];
  }

  static resumeGoal(userId: string, goalId: string): Goal | null {
    const goals = AppStorageRepository.getGoals(userId);
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx === -1 || goals[idx].status !== 'paused') return null;

    const activeGoal = goals.find((g) => g.status === 'in_progress');
    if (activeGoal) {
      throw new Error('ACTIVE_GOAL_EXISTS');
    }

    goals[idx].status = 'in_progress';
    AppStorageRepository.saveGoals(userId, goals);

    addHistoryEntry(userId, {
      goalId,
      action: 'resumed',
      timestamp: new Date().toISOString(),
    });

    return goals[idx];
  }

  static abandonGoal(userId: string, goalId: string): Goal | null {
    const goals = AppStorageRepository.getGoals(userId);
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx === -1) return null;

    goals[idx].status = 'abandoned';
    AppStorageRepository.saveGoals(userId, goals);

    addHistoryEntry(userId, {
      goalId,
      action: 'abandoned',
      timestamp: new Date().toISOString(),
    });

    return goals[idx];
  }

  static createDefaultWeightGoal(
    userId: string,
    profile: UserProfile
  ): Goal | null {
    const activeGoal = this.getActiveGoal(userId);
    if (activeGoal) return null;

    if (!profile.currentWeightKg || !profile.targetWeightKg) return null;

    return this.createGoal({
      userId,
      title: profile.primaryGoal === 'fat_loss'
        ? `Lose ${Math.abs(profile.currentWeightKg - profile.targetWeightKg).toFixed(1)} kg`
        : profile.primaryGoal === 'muscle_gain'
        ? `Gain to ${profile.targetWeightKg} kg`
        : `Reach ${profile.targetWeightKg} kg`,
      category: 'weight',
      metricType: 'weight_kg',
      startValue: profile.currentWeightKg,
      targetValue: profile.targetWeightKg,
      targetDate: profile.targetDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    });
  }
}
