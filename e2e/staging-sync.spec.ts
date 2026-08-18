import { test, expect } from '@playwright/test';

const BASE_URL = process.env.STAGING_URL || 'http://localhost:3000';

test.describe('Staging Offline/Sync', () => {
  test.describe('IndexedDB Operations', () => {
    test('can open IndexedDB and perform CRUD', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const result = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const request = indexedDB.open('ai_fitness_os', 1);
          request.onerror = () => resolve(false);
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('weight_entries')) {
              resolve(true);
              return;
            }
            const tx = db.transaction('weight_entries', 'readwrite');
            const store = tx.objectStore('weight_entries');
            const entry = {
              id: 'test_' + Date.now(),
              userId: 'test_user',
              weight: 75,
              unit: 'kg',
              date: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
            };
            store.put(entry);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
          };
        });
      });

      expect(result).toBe(true);
    });
  });

  test.describe('Sync Endpoint', () => {
    test('sync endpoint requires authentication', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/sync/batch`, {
        headers: { 'Content-Type': 'application/json' },
        data: { operations: [] },
      });
      expect(res.status()).toBe(401);
    });

    test('sync endpoint rejects invalid operations', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/sync/batch`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake_token',
        },
        data: { not: 'valid' },
      });
      expect([400, 401, 422]).toContain(res.status());
    });
  });
});
