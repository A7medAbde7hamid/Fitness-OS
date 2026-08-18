import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncBatchSchema } from '../middleware/validation';

describe('Sync Validation Schemas', () => {
  describe('syncBatchSchema', () => {
    it('accepts valid batch with one operation', () => {
      const result = syncBatchSchema.safeParse({
        operations: [{
          type: 'log_weight',
          payload: { weightKg: 75, measuredAt: '2026-08-18', id: 'm1' },
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
          payload: { weightKg: 75 },
          operationId: 'op_1',
        }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects batch exceeding 50 operations', () => {
      const ops = Array.from({ length: 51 }, (_, i) => ({
        type: 'log_weight',
        payload: { weightKg: 75 },
        idempotencyKey: `key_${i}`,
        operationId: `op_${i}`,
      }));
      const result = syncBatchSchema.safeParse({ operations: ops });
      expect(result.success).toBe(false);
    });

    it('accepts batch with exactly 50 operations', () => {
      const ops = Array.from({ length: 50 }, (_, i) => ({
        type: 'log_weight',
        payload: { weightKg: 75 },
        idempotencyKey: `key_${i}`,
        operationId: `op_${i}`,
      }));
      const result = syncBatchSchema.safeParse({ operations: ops });
      expect(result.success).toBe(true);
    });

    it('accepts all valid operation types', () => {
      const types = ['log_weight', 'log_activity', 'log_meal', 'log_workout'];
      for (const type of types) {
        const result = syncBatchSchema.safeParse({
          operations: [{
            type,
            payload: {},
            idempotencyKey: 'key_1',
            operationId: 'op_1',
          }],
        });
        expect(result.success).toBe(true);
      }
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
