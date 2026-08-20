import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track mock call count to sequence responses
let selectCallCount = 0;

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn((table: string) => ({
      select: vi.fn((cols?: string) => {
        if (table === 'workout_exercises') {
          // workout exercises uses upsert
          return { eq: mockEq, upsert: vi.fn().mockResolvedValue({ error: null }) };
        }
        // select returns eq chain for conflict detection
        mockSelect(table, cols);
        return { eq: mockEq };
      }),
      insert: mockInsert,
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));

// Make eq() chainable and end in single()
const singleResult = vi.fn();
mockEq.mockImplementation(() => ({
  eq: mockEq,
  single: singleResult,
}));

import { SyncService } from '../services/syncService';

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    // Reset mocks to success by default
    mockInsert.mockResolvedValue({ error: null });
    mockEq.mockImplementation(() => ({
      eq: mockEq,
      single: singleResult,
    }));
  });

  describe('upsertMeasurement', () => {
    it('returns conflict when record already exists', async () => {
      singleResult.mockResolvedValueOnce({ data: { id: 'm1', weight_kg: 75, measured_at: '2026-08-18' }, error: null });

      const result = await SyncService.upsertMeasurement('user_1', {
        id: 'm1', weightKg: 75, measuredAt: '2026-08-18',
      }, 'key_1');

      expect(result.success).toBe(true);
      expect(result.conflict).toBe(true);
      expect(result.serverVersion).toBeDefined();
    });

    it('inserts new record successfully', async () => {
      singleResult.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });

      const result = await SyncService.upsertMeasurement('user_1', {
        id: 'm1', weightKg: 75, measuredAt: '2026-08-18', notes: 'morning',
      }, 'key_1');

      expect(result.success).toBe(true);
      expect(result.conflict).toBeFalsy();
    });

    it('returns error on database failure', async () => {
      singleResult.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });
      mockInsert.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await SyncService.upsertMeasurement('user_1', {
        id: 'm1', weightKg: 75, measuredAt: '2026-08-18',
      }, 'key_1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });

  describe('upsertActivity', () => {
    it('returns conflict when record exists', async () => {
      singleResult.mockResolvedValueOnce({ data: { id: 'a1' }, error: null });

      const result = await SyncService.upsertActivity('user_1', {
        id: 'a1', activityType: 'running', durationMinutes: 30,
        caloriesBurned: 300, loggedAt: '2026-08-18',
      }, 'key_1');

      expect(result.success).toBe(true);
      expect(result.conflict).toBe(true);
    });

    it('inserts new activity', async () => {
      singleResult.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });

      const result = await SyncService.upsertActivity('user_1', {
        id: 'a1', activityType: 'running', durationMinutes: 30,
        caloriesBurned: 300, steps: 4000, loggedAt: '2026-08-18',
      }, 'key_1');

      expect(result.success).toBe(true);
    });
  });

  describe('upsertMeal', () => {
    it('returns conflict when meal exists', async () => {
      singleResult.mockResolvedValueOnce({ data: { id: 'meal_1' }, error: null });

      const result = await SyncService.upsertMeal('user_1', {
        id: 'meal_1', name: 'Chicken Salad', mealType: 'lunch',
        calories: 500, proteinG: 35, carbsG: 30, fatG: 20,
        loggedAt: '2026-08-18',
      }, 'key_1');

      expect(result.success).toBe(true);
      expect(result.conflict).toBe(true);
    });

    it('inserts new meal', async () => {
      singleResult.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });

      const result = await SyncService.upsertMeal('user_1', {
        id: 'meal_1', name: 'Chicken Salad', mealType: 'lunch',
        calories: 500, proteinG: 35, carbsG: 30, fatG: 20,
        loggedAt: '2026-08-18',
      }, 'key_1');

      expect(result.success).toBe(true);
    });
  });

  describe('upsertWorkout', () => {
    it('inserts workout with exercises', async () => {
      // 1st single() = conflict check (no conflict)
      // 2nd single() = get server workout ID for exercises
      singleResult
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Row not found' } })
        .mockResolvedValueOnce({ data: { id: 'server_w1' }, error: null });

      const result = await SyncService.upsertWorkout('user_1', {
        id: 'w1', title: 'Push Day', category: 'Push',
        durationMinutes: 45, completed: true,
        exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weightKg: 80 }],
        loggedAt: '2026-08-18',
      }, 'key_1');

      expect(result.success).toBe(true);
    });

    it('returns conflict when workout exists', async () => {
      singleResult.mockResolvedValueOnce({ data: { id: 'w1' }, error: null });

      const result = await SyncService.upsertWorkout('user_1', {
        id: 'w1', title: 'Push Day', category: 'Push',
        durationMinutes: 45, completed: true, loggedAt: '2026-08-18',
      }, 'key_1');

      expect(result.success).toBe(true);
      expect(result.conflict).toBe(true);
    });
  });

  describe('processBatch', () => {
    it('processes mixed operation types', async () => {
      // Sequence: first call = no conflict, second call = conflict
      singleResult
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Row not found' } })
        .mockResolvedValueOnce({ data: { id: 'a1' }, error: null });

      const results = await SyncService.processBatch('user_1', [
        { type: 'log_weight', payload: { id: 'm1', weightKg: 75, measuredAt: '2026-08-18' }, idempotencyKey: 'k1', operationId: 'op1' },
        { type: 'log_activity', payload: { id: 'a1', activityType: 'running', durationMinutes: 30, caloriesBurned: 300, loggedAt: '2026-08-18' }, idempotencyKey: 'k2', operationId: 'op2' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].conflict).toBeFalsy();
      expect(results[1].success).toBe(true);
      expect(results[1].conflict).toBe(true);
    });

    it('returns error for unknown operation type', async () => {
      const results = await SyncService.processBatch('user_1', [
        { type: 'unknown_type', payload: {}, idempotencyKey: 'k1', operationId: 'op1' },
      ]);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Unknown operation type');
    });
  });
});
