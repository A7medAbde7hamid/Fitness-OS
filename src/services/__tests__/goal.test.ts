import { describe, it, expect, beforeEach } from 'vitest';
import { GoalService } from '../goal';
import { Goal } from '../../types';

const TEST_USER_ID = 'test_user_001';

describe('GoalService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a goal', () => {
    const goal = GoalService.createGoal({
      userId: TEST_USER_ID,
      title: 'Lose 5 kg',
      category: 'weight',
      metricType: 'weight_kg',
      startValue: 76,
      targetValue: 71,
      targetDate: '2026-12-31',
    });

    expect(goal.id).toBeTruthy();
    expect(goal.title).toBe('Lose 5 kg');
    expect(goal.status).toBe('in_progress');
    expect(goal.startValue).toBe(76);
    expect(goal.targetValue).toBe(71);
  });

  it('enforces one active goal constraint', () => {
    GoalService.createGoal({
      userId: TEST_USER_ID,
      title: 'Goal 1',
      category: 'weight',
      metricType: 'weight_kg',
      startValue: 76,
      targetValue: 71,
      targetDate: '2026-12-31',
    });

    expect(() => {
      GoalService.createGoal({
        userId: TEST_USER_ID,
        title: 'Goal 2',
        category: 'weight',
        metricType: 'weight_kg',
        startValue: 76,
        targetValue: 71,
        targetDate: '2026-12-31',
      });
    }).toThrow('ACTIVE_GOAL_EXISTS');
  });

  it('pauses and resumes goals', () => {
    const goal = GoalService.createGoal({
      userId: TEST_USER_ID,
      title: 'Test Goal',
      category: 'weight',
      metricType: 'weight_kg',
      startValue: 76,
      targetValue: 71,
      targetDate: '2026-12-31',
    });

    GoalService.pauseGoal(TEST_USER_ID, goal.id);
    const paused = GoalService.getGoalById(TEST_USER_ID, goal.id);
    expect(paused?.status).toBe('paused');

    GoalService.resumeGoal(TEST_USER_ID, goal.id);
    const resumed = GoalService.getGoalById(TEST_USER_ID, goal.id);
    expect(resumed?.status).toBe('in_progress');
  });

  it('prevents resume when active goal exists', () => {
    const goal1 = GoalService.createGoal({
      userId: TEST_USER_ID,
      title: 'Goal 1',
      category: 'weight',
      metricType: 'weight_kg',
      startValue: 76,
      targetValue: 71,
      targetDate: '2026-12-31',
    });

    GoalService.pauseGoal(TEST_USER_ID, goal1.id);

    const goal2 = GoalService.createGoal({
      userId: TEST_USER_ID,
      title: 'Goal 2',
      category: 'weight',
      metricType: 'weight_kg',
      startValue: 76,
      targetValue: 70,
      targetDate: '2026-12-31',
    });

    expect(() => {
      GoalService.resumeGoal(TEST_USER_ID, goal1.id);
    }).toThrow('ACTIVE_GOAL_EXISTS');
  });

  it('abandons a goal', () => {
    const goal = GoalService.createGoal({
      userId: TEST_USER_ID,
      title: 'Test Goal',
      category: 'weight',
      metricType: 'weight_kg',
      startValue: 76,
      targetValue: 71,
      targetDate: '2026-12-31',
    });

    GoalService.abandonGoal(TEST_USER_ID, goal.id);
    const abandoned = GoalService.getGoalById(TEST_USER_ID, goal.id);
    expect(abandoned?.status).toBe('abandoned');
  });

  it('returns null for getActiveGoal when none exists', () => {
    expect(GoalService.getActiveGoal(TEST_USER_ID)).toBeNull();
  });

  it('returns goal history', () => {
    const goal = GoalService.createGoal({
      userId: TEST_USER_ID,
      title: 'Test Goal',
      category: 'weight',
      metricType: 'weight_kg',
      startValue: 76,
      targetValue: 71,
      targetDate: '2026-12-31',
    });

    const history = GoalService.getGoalHistory(TEST_USER_ID);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].goalId).toBe(goal.id);
    expect(history[0].action).toBe('created');
  });
});
