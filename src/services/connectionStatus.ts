import { SyncOperation } from '../types';
import { SyncQueueService } from './syncQueue';
import { supabase } from '../db/supabase';

const SERVER_BASE = '';

async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function serverSyncBatch(operations: Array<{
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  operationId: string;
}>): Promise<Array<{ operationId: string; success: boolean; conflict?: boolean; error?: string }>> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${SERVER_BASE}/api/sync/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ operations }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Sync failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.results || [];
}

export class ConnectionStatusService {
  static async executeSyncOperation(op: SyncOperation): Promise<boolean> {
    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token — cannot sync to server');
      return false;
    }

    const idempotencyKey = (op.payload._idempotencyKey as string) || op.id;

    try {
      const results = await serverSyncBatch([{
        type: op.type,
        payload: op.payload,
        idempotencyKey,
        operationId: op.id,
      }]);

      const result = results[0];
      if (!result) return false;

      if (result.success) return true;
      if (result.conflict) {
        console.warn(`Sync conflict for operation ${op.id} — server version kept`);
        return true; // conflict = already on server = success from client perspective
      }

      console.warn(`Sync failed for operation ${op.id}: ${result.error}`);
      return false;
    } catch (err) {
      console.error('Sync execution error:', err);
      return false;
    }
  }

  static onReconnect(): void {
    SyncQueueService.getCount().then((counts) => {
      if (counts.pending > 0 || counts.failed > 0) {
        SyncQueueService.processQueue(this.executeSyncOperation);
      }
    });
  }
}
