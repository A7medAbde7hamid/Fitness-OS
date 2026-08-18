import { test, expect } from '@playwright/test';
import { waitForAppReady, waitForDemoMode, expectMetaContent } from './helpers';

test.describe('App Launch', () => {
  test('loads the landing page', async ({ page }) => {
    await waitForAppReady(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('has correct meta tags', async ({ page }) => {
    await waitForAppReady(page);
    await expectMetaContent(page, 'theme-color', '#0A0A0A');
  });

  test('manifest is linked', async ({ page }) => {
    await waitForAppReady(page);
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBe('/manifest.json');
  });

  test('service worker is registered', async ({ page }) => {
    await waitForAppReady(page);
    const swReady = page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => true).catch(() => false)
    );
    await expect.poll(async () => swReady, { timeout: 10_000 }).toBeTruthy();
  });
});

test.describe('Demo Mode', () => {
  test('can enter demo mode', async ({ page }) => {
    await waitForDemoMode(page);
    await expect(page.locator('body')).not.toHaveText(/Sign In|تسجيل الدخول/);
  });
});

test.describe('PWA Manifest', () => {
  test('manifest.json is valid', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    const manifest = await response?.json();
    expect(manifest.name).toBe('AI Fitness OS');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});

test.describe('Offline Fallback', () => {
  test('offline.html is served', async ({ page }) => {
    const response = await page.goto('/offline.html');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Accessibility', () => {
  test('page has lang attribute', async ({ page }) => {
    await waitForAppReady(page);
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('page has viewport meta', async ({ page }) => {
    await waitForAppReady(page);
    const content = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(content).toContain('width=device-width');
  });
});

test.describe('Mobile Viewports', () => {
  const viewports = [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 360, height: 640, name: 'Galaxy S5' },
    { width: 375, height: 812, name: 'iPhone X' },
    { width: 390, height: 844, name: 'iPhone 12' },
    { width: 414, height: 896, name: 'iPhone 11' },
  ];

  for (const vp of viewports) {
    test(`renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await waitForAppReady(page);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
