import { test, expect } from '@playwright/test';

const BASE_URL = process.env.STAGING_URL || 'http://localhost:3000';

test.describe('Staging Full Validation', () => {
  test.describe('App Loading', () => {
    test('loads the application', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });

    test('has correct meta tags', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(themeColor).toBe('#0A0A0A');
    });

    test('manifest is linked', async ({ page }) => {
      await page.goto('/');
      const href = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(href).toBe('/manifest.json');
    });
  });

  test.describe('PWA', () => {
    test('manifest.json is valid', async ({ page }) => {
      const response = await page.goto('/manifest.json');
      expect(response?.status()).toBe(200);
      const manifest = await response?.json();
      expect(manifest.name).toBe('AI Fitness OS');
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    test('service worker is registered', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const swReady = page.evaluate(() =>
        navigator.serviceWorker.ready.then(() => true).catch(() => false)
      );
      await expect.poll(async () => swReady, { timeout: 10_000 }).toBeTruthy();
    });

    test('offline.html is served', async ({ page }) => {
      const response = await page.goto('/offline.html');
      expect(response?.status()).toBe(200);
    });
  });

  test.describe('Mobile Viewports', () => {
    const viewports = [
      { width: 375, height: 812, name: 'iPhone X' },
      { width: 390, height: 844, name: 'iPhone 12' },
      { width: 414, height: 896, name: 'iPhone 11' },
    ];

    for (const vp of viewports) {
      test(`renders at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('body')).toBeVisible();
      });
    }
  });

  test.describe('Accessibility', () => {
    test('page has lang attribute', async ({ page }) => {
      await page.goto('/');
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBeTruthy();
    });

    test('page has viewport meta', async ({ page }) => {
      await page.goto('/');
      const content = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(content).toContain('width=device-width');
    });
  });

  test.describe('API Health', () => {
    test('health endpoint returns structured response', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/health`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('checks');
    });
  });
});
