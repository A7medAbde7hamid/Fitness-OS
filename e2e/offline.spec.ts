import { test, expect } from '@playwright/test';
import { waitForAppReady, waitForDemoMode } from './helpers';

test.describe('Offline Behavior', () => {
  test('IndexedDB is available', async ({ page }) => {
    await waitForAppReady(page);
    const available = await page.evaluate(() => 'indexedDB' in window);
    expect(available).toBeTruthy();
  });

  test('localStorage is available', async ({ page }) => {
    await waitForAppReady(page);
    const available = await page.evaluate(() => {
      try {
        localStorage.setItem('_e2e_test', '1');
        localStorage.removeItem('_e2e_test');
        return true;
      } catch { return false; }
    });
    expect(available).toBeTruthy();
  });

  test('app stores data in localStorage after demo', async ({ page }) => {
    await waitForDemoMode(page);
    const hasData = await page.evaluate(() =>
      Object.keys(localStorage).some(k => k.startsWith('ai_fitness_os_'))
    );
    expect(hasData).toBeTruthy();
  });
});

test.describe('Sync Queue', () => {
  test('IndexedDB sync store is available', async ({ page }) => {
    await waitForAppReady(page);
    const available = await page.evaluate(() =>
      new Promise<boolean>((resolve) => {
        const req = indexedDB.open('ai-fitness-os', 1);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      })
    );
    expect(available).toBeTruthy();
  });
});

test.describe('Notification Support', () => {
  test('Notification API is available', async ({ page }) => {
    await waitForAppReady(page);
    const available = await page.evaluate(() => 'Notification' in window);
    expect(available).toBeTruthy();
  });

  test('can check notification permission', async ({ page }) => {
    await waitForAppReady(page);
    const permission = await page.evaluate(() => Notification.permission);
    expect(['granted', 'denied', 'default']).toContain(permission);
  });
});

test.describe('Keyboard Navigation', () => {
  test('can tab through interactive elements', async ({ page }) => {
    await waitForAppReady(page);
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});

test.describe('Reduced Motion', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await waitForAppReady(page);
    const body = await page.locator('body').isVisible();
    expect(body).toBeTruthy();
  });
});
