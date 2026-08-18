import { IndexedDBRepository } from '../db/indexedDb';
import { SyncOperation, SyncOperationType, SyncOperationStatus } from '../types';

let syncInterval: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;
const listeners: Set<() => void> = new Set();

function generateIdempotencyKey(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateOperationId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class SyncQueueService {
  static async enqueue(
    type: SyncOperationType,
    payload: Record<string, unknown>,
    userId: string
  ): Promise<SyncOperation> {
    const operation: SyncOperation = {
      id: generateOperationId(),
      type,
      payload: { ...payload, _idempotencyKey: generateIdempotencyKey() },
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
      userId,
    };

    await IndexedDBRepository.addToSyncQueue(operation);
    listeners.forEach((l) => l());
    return operation;
  }

  static async getQueue(): Promise<SyncOperation[]> {
    return IndexedDBRepository.getSyncQueue();
  }

  static async getPending(): Promise<SyncOperation[]> {
    return IndexedDBRepository.getSyncQueueByStatus('pending');
  }

  static async getSyncing(): Promise<SyncOperation[]> {
    return IndexedDBRepository.getSyncQueueByStatus('syncing');
  }

  static async getFailed(): Promise<SyncOperation[]> {
    return IndexedDBRepository.getSyncQueueByStatus('failed');
  }

  static async getCount(): Promise<{ pending: number; syncing: number; failed: number; total: number }> {
    const all = await IndexedDBRepository.getSyncQueue();
    return {
      pending: all.filter((o) => o.status === 'pending').length,
      syncing: all.filter((o) => o.status === 'syncing').length,
      failed: all.filter((o) => o.status === 'failed').length,
      total: all.length,
    };
  }

  static async processQueue(
    executor: (op: SyncOperation) => Promise<boolean>
  ): Promise<{ synced: number; failed: number }> {
    if (isSyncing) return { synced: 0, failed: 0 };
    isSyncing = true;
    listeners.forEach((l) => l());

    let synced = 0;
    let failed = 0;

    try {
      const pending = await IndexedDBRepository.getSyncQueueByStatus('pending');

      for (const op of pending) {
        op.status = 'syncing';
        await IndexedDBRepository.updateSyncOperation(op);

        try {
          const success = await executor(op);

          if (success) {
            await IndexedDBRepository.removeSyncOperation(op.id);
            synced++;
          } else {
            op.retryCount++;
            op.status = op.retryCount >= 3 ? 'failed' : 'pending';
            op.lastError = 'Executor returned false';
            await IndexedDBRepository.updateSyncOperation(op);
            failed++;
          }
        } catch (error) {
          op.retryCount++;
          op.status = op.retryCount >= 3 ? 'failed' : 'pending';
          op.lastError = error instanceof Error ? error.message : 'Unknown error';
          await IndexedDBRepository.updateSyncOperation(op);
          failed++;
        }
      }
    } finally {
      isSyncing = false;
      listeners.forEach((l) => l());
    }

    return { synced, failed };
  }

  static async retryFailed(executor: (op: SyncOperation) => Promise<boolean>): Promise<{ synced: number; failed: number }> {
    const failed = await IndexedDBRepository.getSyncQueueByStatus('failed');
    for (const op of failed) {
      op.status = 'pending';
      op.retryCount = 0;
      op.lastError = undefined;
      await IndexedDBRepository.updateSyncOperation(op);
    }
    return this.processQueue(executor);
  }

  static async retryAll(executor: (op: SyncOperation) => Promise<boolean>): Promise<{ synced: number; failed: number }> {
    return this.retryFailed(executor);
  }

  static async removeOperation(id: string): Promise<void> {
    await IndexedDBRepository.removeSyncOperation(id);
    listeners.forEach((l) => l());
  }

  static startAutoSync(
    executor: (op: SyncOperation) => Promise<boolean>,
    intervalMs: number = 30000
  ): void {
    this.stopAutoSync();
    syncInterval = setInterval(async () => {
      if (!navigator.onLine) return;
      await this.processQueue(executor);
    }, intervalMs);
  }

  static stopAutoSync(): void {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  }

  static isSyncing(): boolean {
    return isSyncing;
  }

  static onQueueChange(callback: () => void): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }
}
