import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncQueueService } from '../syncQueue';
import { IndexedDBRepository } from '../../db/indexedDb';

// Mock IndexedDB
const mockStore: Record<string, any[]> = {};

vi.mock('../../db/indexedDb', () => ({
  IndexedDBRepository: {
    getSyncQueue: vi.fn(async () => mockStore['syncQueue'] || []),
    getSyncQueueByStatus: vi.fn(async (status: string) =>
      (mockStore['syncQueue'] || []).filter((op: any) => op.status === status)
    ),
    addToSyncQueue: vi.fn(async (op: any) => {
      if (!mockStore['syncQueue']) mockStore['syncQueue'] = [];
      mockStore['syncQueue'].push(op);
    }),
    updateSyncOperation: vi.fn(async (op: any) => {
      const idx = (mockStore['syncQueue'] || []).findIndex((o: any) => o.id === op.id);
      if (idx >= 0) mockStore['syncQueue'][idx] = op;
    }),
    removeSyncOperation: vi.fn(async (id: string) => {
      mockStore['syncQueue'] = (mockStore['syncQueue'] || []).filter((o: any) => o.id !== id);
    }),
  },
}));

describe('SyncQueueService', () => {
  beforeEach(() => {
    mockStore['syncQueue'] = [];
    vi.clearAllMocks();
  });

  it('creates a sync operation with idempotency key', async () => {
    const op = await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');
    expect(op.id).toBeDefined();
    expect(op.type).toBe('log_weight');
    expect(op.userId).toBe('user_1');
    expect(op.status).toBe('pending');
    expect(op.retryCount).toBe(0);
    expect(op.payload._idempotencyKey).toBeDefined();
  });

  it('generates unique operation IDs', async () => {
    const op1 = await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');
    const op2 = await SyncQueueService.enqueue('log_weight', { weightKg: 76 }, 'user_1');
    expect(op1.id).not.toBe(op2.id);
  });

  it('creates operations with different idempotency keys', async () => {
    const op1 = await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');
    const op2 = await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');
    expect(op1.payload._idempotencyKey).not.toBe(op2.payload._idempotencyKey);
  });

  it('retrieves queue by status', async () => {
    await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');
    await SyncQueueService.enqueue('log_activity', { steps: 5000 }, 'user_1');

    const pending = await SyncQueueService.getPending();
    expect(pending.length).toBe(2);
  });

  it('processes queue successfully', async () => {
    await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');
    await SyncQueueService.enqueue('log_weight', { weightKg: 76 }, 'user_1');

    const executor = vi.fn(async () => true);
    const result = await SyncQueueService.processQueue(executor);

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('handles executor failure', async () => {
    await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');

    const executor = vi.fn(async () => { throw new Error('Network error'); });
    const result = await SyncQueueService.processQueue(executor);

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
  });

  it('retries failed operations up to 3 times', async () => {
    await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');

    const executor = vi.fn(async () => { throw new Error('Error'); });
    await SyncQueueService.processQueue(executor);
    await SyncQueueService.processQueue(executor);
    await SyncQueueService.processQueue(executor);

    const failed = await SyncQueueService.getFailed();
    expect(failed.length).toBe(1);
    expect(failed[0].retryCount).toBe(3);
  });

  it('does not process when already syncing', async () => {
    await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');

    let resolveSecond: any;
    const blockingPromise = new Promise<boolean>((resolve) => { resolveSecond = resolve; });

    const executor = vi.fn(async () => {
      await blockingPromise;
      return true;
    });

    // Start first process (will block)
    const first = SyncQueueService.processQueue(executor);

    // Second process should return immediately
    const result = await SyncQueueService.processQueue(executor);
    expect(result.synced).toBe(0);

    resolveSecond(true);
    await first;
  });

  it('retries failed operations with retryFailed', async () => {
    // Manually set up a failed operation in the mock store
    mockStore['syncQueue'] = [{
      id: 'test_failed_op',
      type: 'log_weight' as const,
      payload: { weightKg: 75, _idempotencyKey: 'key_1' },
      createdAt: new Date().toISOString(),
      retryCount: 3,
      status: 'failed' as const,
      lastError: 'Network error',
      userId: 'user_1',
    }];

    const failed = await SyncQueueService.getFailed();
    expect(failed.length).toBe(1);
    expect(failed[0].status).toBe('failed');

    const successExecutor = vi.fn(async () => true);
    const result = await SyncQueueService.retryFailed(successExecutor);
    expect(result.synced).toBe(1);
  });

  it('gets queue count', async () => {
    await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');
    await SyncQueueService.enqueue('log_weight', { weightKg: 76 }, 'user_1');

    const counts = await SyncQueueService.getCount();
    expect(counts.pending).toBe(2);
    expect(counts.total).toBe(2);
  });

  it('notifies listeners on queue change', async () => {
    const listener = vi.fn();
    const unsub = SyncQueueService.onQueueChange(listener);

    await SyncQueueService.enqueue('log_weight', { weightKg: 75 }, 'user_1');
    expect(listener).toHaveBeenCalled();

    unsub();
  });
});
