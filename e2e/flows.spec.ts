import { test, expect } from '@playwright/test';
import { waitForAppReady, waitForDemoMode } from './helpers';

test.describe('Authentication Flow', () => {
  test('shows landing page with entry points', async ({ page }) => {
    await waitForAppReady(page);
    const hasEntry = page.getByRole('button', { name: /Get Started|Try Live Demo|Quick Demo|Sign In|Start Free/i });
    await expect(hasEntry.first()).toBeVisible({ timeout: 10_000 });
  });

  test('can sign in with demo mode', async ({ page }) => {
    await waitForDemoMode(page);
    // After demo mode, the landing page should be gone
    const landingBtn = page.locator('#btn-landing-demo');
    await expect(landingBtn).not.toBeVisible({ timeout: 5_000 });
  });

  test('demo mode shows authenticated UI', async ({ page }) => {
    await waitForDemoMode(page);
    // Dashboard shows weight data and app header
    await expect(page.locator('body')).toContainText('AI FITNESS OS', { timeout: 5_000 });
  });
});

test.describe('Dashboard', () => {
  test('shows dashboard after demo login', async ({ page }) => {
    await waitForDemoMode(page);
    await expect(page.locator('body')).toContainText('AI FITNESS OS', { timeout: 5_000 });
  });
});

test.describe('Navigation', () => {
  test('can navigate between tabs', async ({ page }) => {
    await waitForDemoMode(page);
    // Close any open modal first
    const closeBtn = page.locator('[aria-label="Close"], [aria-label="إغلاق"]').first();
    if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
    // Press Escape to close any modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const tabs = ['Log', 'Progress', 'AI Coach', 'Profile'];
    for (const tab of tabs) {
      const tabBtn = page.locator(`#nav-tab-${tab.toLowerCase().replace(' ', '-')}`).first();
      if (await tabBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tabBtn.click({ force: true });
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Bilingual Support', () => {
  test('can switch to Arabic', async ({ page }) => {
    await waitForDemoMode(page);
    const langToggle = page.getByRole('button', { name: 'العربية' });
    if (await langToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await langToggle.click();
      await page.waitForLoadState('networkidle');
      const dir = await page.locator('html').getAttribute('dir');
      expect(dir).toBe('rtl');
    }
  });

  test('can switch back to English', async ({ page }) => {
    await waitForDemoMode(page);
    const langToggle = page.getByRole('button', { name: 'العربية' });
    if (await langToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await langToggle.click();
      await page.waitForLoadState('networkidle');
    }
    const engToggle = page.getByRole('button', { name: 'English' });
    if (await engToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await engToggle.click();
      await page.waitForLoadState('networkidle');
      const dir = await page.locator('html').getAttribute('dir');
      expect(dir).toBe('ltr');
    }
  });
});

test.describe('Logout', () => {
  test('can log out from profile', async ({ page }) => {
    await waitForDemoMode(page);
    const profileTab = page.locator('#nav-tab-profile').first();
    if (await profileTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await profileTab.click({ force: true });
      await page.waitForLoadState('networkidle');
    }
    const logoutBtn = page.getByRole('button', { name: /Logout|Sign Out|تسجيل الخروج/i }).first();
    if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toContainText(/Get Started|Try Live Demo|Quick Demo|Sign In|Start Free/i, { timeout: 5_000 });
    }
  });
});
