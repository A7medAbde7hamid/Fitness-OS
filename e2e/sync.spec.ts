import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers';

test.describe('Sync: Queue Operations (IndexedDB)', () => {
  test('can write, read, update, and delete sync operations', async ({ page }) => {
    await waitForAppReady(page);

    // Write
    const writeResult = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const req = indexedDB.open('ai-fitness-os', 1);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('syncQueue')) { resolve(false); return; }
          const tx = db.transaction('syncQueue', 'readwrite');
          tx.objectStore('syncQueue').put({
            id: 'e2e_test_op_1',
            type: 'log_weight',
            payload: { weightKg: 75, measuredAt: new Date().toISOString() },
            createdAt: new Date().toISOString(),
            retryCount: 0,
            status: 'pending',
            userId: 'e2e_user',
          });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        };
        req.onerror = () => resolve(false);
      });
    });
    expect(writeResult).toBeTruthy();

    // Read
    const readStatus = await page.evaluate(async () => {
      return new Promise<string>((resolve) => {
        const req = indexedDB.open('ai-fitness-os', 1);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('syncQueue', 'readonly');
          const getReq = tx.objectStore('syncQueue').get('e2e_test_op_1');
          getReq.onsuccess = () => resolve(getReq.result?.status || 'not_found');
          getReq.onerror = () => resolve('error');
        };
        req.onerror = () => resolve('error');
      });
    });
    expect(readStatus).toBe('pending');

    // Update
    const updateResult = await page.evaluate(async () => {
      return new Promise<string>((resolve) => {
        const req = indexedDB.open('ai-fitness-os', 1);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('syncQueue', 'readwrite');
          const store = tx.objectStore('syncQueue');
          const getReq = store.get('e2e_test_op_1');
          getReq.onsuccess = () => {
            const op = getReq.result;
            if (op) { op.status = 'syncing'; store.put(op); }
          };
          tx.oncomplete = () => {
            const readTx = db.transaction('syncQueue', 'readonly');
            const getReq2 = readTx.objectStore('syncQueue').get('e2e_test_op_1');
            getReq2.onsuccess = () => resolve(getReq2.result?.status || 'not_found');
          };
        };
      });
    });
    expect(updateResult).toBe('syncing');

    // Delete
    const deleteResult = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const req = indexedDB.open('ai-fitness-os', 1);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('syncQueue', 'readwrite');
          tx.objectStore('syncQueue').delete('e2e_test_op_1');
          tx.oncomplete = () => {
            const readTx = db.transaction('syncQueue', 'readonly');
            const getReq = readTx.objectStore('syncQueue').get('e2e_test_op_1');
            getReq.onsuccess = () => resolve(getReq.result === undefined);
          };
        };
      });
    });
    expect(deleteResult).toBeTruthy();
  });

  test('IndexedDB sync store exists and is functional', async ({ page }) => {
    await waitForAppReady(page);
    const available = await page.evaluate(() =>
      new Promise<boolean>((resolve) => {
        const req = indexedDB.open('ai-fitness-os', 1);
        req.onsuccess = () => {
          const db = req.result;
          resolve(db.objectStoreNames.contains('syncQueue'));
        };
        req.onerror = () => resolve(false);
      })
    );
    expect(available).toBeTruthy();
  });
});

test.describe('Sync: Server Authentication', () => {
  test('sync endpoint requires authentication', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [{
            type: 'log_weight',
            payload: { id: 'test', weightKg: 75, measuredAt: new Date().toISOString() },
            idempotencyKey: 'key_1',
            operationId: 'op_1',
          }],
        }),
      });
      return { status: res.status };
    });
    expect(result.status).toBe(401);
  });

  test('sync endpoint rejects invalid token', async ({ page }) => {
    await waitForAppReady(page);
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake_token',
        },
        body: JSON.stringify({
          operations: [{
            type: 'log_weight',
            payload: { id: 'test', weightKg: 75, measuredAt: new Date().toISOString() },
            idempotencyKey: 'key_1',
            operationId: 'op_1',
          }],
        }),
      });
      return { status: res.status };
    });
    // 401 when Supabase configured (invalid token), 503 when not configured
    expect([401, 503]).toContain(result.status);
  });
});
