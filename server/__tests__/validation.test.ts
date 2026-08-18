import { describe, it, expect } from 'vitest';
import { syncBatchSchema } from '../middleware/validation';

describe('Sync Validation Schemas', () => {
  describe('syncBatchSchema', () => {
    it('accepts valid batch with one operation', () => {
      const result = syncBatchSchema.safeParse({
        operations: [{
          type: 'log_weight',
          payload: { id: 'm1', weightKg: 75, measuredAt: '2026-08-18' },
          idempotencyKey: 'key_1',
          operationId: 'op_1',
        }],
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty operations array', () => {
      const result = syncBatchSchema.safeParse({ operations: [] });
      expect(result.success).toBe(false);
    });

    it('rejects invalid operation type', () => {
      const result = syncBatchSchema.safeParse({
        operations: [{
          type: 'delete_account',
          payload: {},
          idempotencyKey: 'key_1',
          operationId: 'op_1',
        }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing idempotencyKey', () => {
      const result = syncBatchSchema.safeParse({
        operations: [{
          type: 'log_weight',
          payload: { id: 'm1', weightKg: 75, measuredAt: '2026-08-18' },
          operationId: 'op_1',
        }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects batch exceeding 50 operations', () => {
      const ops = Array.from({ length: 51 }, (_, i) => ({
        type: 'log_weight',
        payload: { id: `m${i}`, weightKg: 75, measuredAt: '2026-08-18' },
        idempotencyKey: `key_${i}`,
        operationId: `op_${i}`,
      }));
      const result = syncBatchSchema.safeParse({ operations: ops });
      expect(result.success).toBe(false);
    });

    it('accepts batch with exactly 50 operations', () => {
      const ops = Array.from({ length: 50 }, (_, i) => ({
        type: 'log_weight',
        payload: { id: `m${i}`, weightKg: 75, measuredAt: '2026-08-18' },
        idempotencyKey: `key_${i}`,
        operationId: `op_${i}`,
      }));
      const result = syncBatchSchema.safeParse({ operations: ops });
      expect(result.success).toBe(true);
    });

    it('accepts all valid operation types with valid payloads', () => {
      const validPayloads: Record<string, Record<string, unknown>> = {
        log_weight: { id: 'm1', weightKg: 75, measuredAt: '2026-08-18' },
        log_activity: { id: 'a1', activityType: 'running', durationMinutes: 30, caloriesBurned: 300, loggedAt: '2026-08-18' },
        log_meal: { id: 'ml1', name: 'Chicken breast', mealType: 'lunch', calories: 400, proteinG: 35, carbsG: 10, fatG: 12, loggedAt: '2026-08-18' },
        log_workout: { id: 'w1', title: 'Push Day', category: 'Push', durationMinutes: 60, completed: true, loggedAt: '2026-08-18' },
      };
      for (const [type, payload] of Object.entries(validPayloads)) {
        const result = syncBatchSchema.safeParse({
          operations: [{
            type,
            payload,
            idempotencyKey: 'key_1',
            operationId: 'op_1',
          }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects payload missing required fields for type', () => {
      const result = syncBatchSchema.safeParse({
        operations: [{
          type: 'log_weight',
          payload: { weightKg: 75 },
          idempotencyKey: 'key_1',
          operationId: 'op_1',
        }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = syncBatchSchema.safeParse({
        operations: [{
          type: 'log_weight',
        }],
      });
      expect(result.success).toBe(false);
    });
  });
});
