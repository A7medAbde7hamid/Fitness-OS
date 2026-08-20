import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers';

test.describe('Landing CTA Navigation', () => {
  test('Get Started Free navigates to auth page', async ({ page }) => {
    await waitForAppReady(page);
    const ctaBtn = page.locator('#btn-landing-get-started');
    await expect(ctaBtn).toBeVisible({ timeout: 10_000 });
    await ctaBtn.click();
    await page.waitForLoadState('networkidle');
    // Auth view should be visible
    await expect(page.locator('#auth-view')).toBeVisible({ timeout: 5_000 });
  });

  test('Launch Now button navigates to auth page', async ({ page }) => {
    await waitForAppReady(page);
    const launchBtn = page.locator('#btn-landing-launch-now');
    await expect(launchBtn).toBeVisible({ timeout: 10_000 });
    await launchBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#auth-view')).toBeVisible({ timeout: 5_000 });
  });

  test('Demo button enters isolated demo mode', async ({ page }) => {
    await waitForAppReady(page);
    const demoBtn = page.locator('#btn-landing-demo');
    await expect(demoBtn).toBeVisible({ timeout: 10_000 });
    await demoBtn.click();
    await page.waitForLoadState('networkidle');
    // Should show demo badge
    await expect(page.locator('#demo-mode-badge')).toBeVisible({ timeout: 5_000 });
    // Should NOT show auth view
    await expect(page.locator('#auth-view')).not.toBeVisible({ timeout: 2_000 });
  });

  test('back to landing button works from auth', async ({ page }) => {
    await waitForAppReady(page);
    const ctaBtn = page.locator('#btn-landing-get-started');
    await ctaBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#auth-view')).toBeVisible({ timeout: 5_000 });

    const backBtn = page.locator('#btn-auth-back-landing');
    await backBtn.click();
    await page.waitForLoadState('networkidle');
    // Should show landing again
    await expect(page.locator('#btn-landing-get-started')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Auth View Features', () => {
  test('login and register tabs work', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator('#btn-landing-get-started').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#auth-view')).toBeVisible({ timeout: 5_000 });

    // Default should be login tab
    const loginTab = page.locator('#tab-auth-login');
    await expect(loginTab).toHaveAttribute('class', /bg-\[#FF4E00\]/);

    // Switch to register
    const registerTab = page.locator('#tab-auth-register');
    await registerTab.click();
    await page.waitForTimeout(300);
    await expect(registerTab).toHaveAttribute('class', /bg-\[#FF4E00\]/);

    // Name field should be visible in register mode
    await expect(page.locator('#input-auth-name')).toBeVisible();

    // Switch back to login
    await loginTab.click();
    await page.waitForTimeout(300);
    await expect(loginTab).toHaveAttribute('class', /bg-\[#FF4E00\]/);
  });

  test('show/hide password toggle works', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator('#btn-landing-get-started').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#auth-view')).toBeVisible({ timeout: 5_000 });

    const passwordInput = page.locator('#input-auth-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = page.locator('#btn-toggle-password');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('forgot password flow works', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator('#btn-landing-get-started').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#auth-view')).toBeVisible({ timeout: 5_000 });

    const forgotBtn = page.locator('#btn-forgot-password');
    await forgotBtn.click();
    await page.waitForTimeout(300);

    // Should show forgot password form
    await expect(page.locator('#input-forgot-email')).toBeVisible();
    await expect(page.locator('#btn-forgot-submit')).toBeVisible();

    // Back to login
    const backToLogin = page.getByRole('button', { name: /Back to sign in|العودة لتسجيل الدخول/i });
    await backToLogin.click();
    await page.waitForTimeout(300);
    await expect(page.locator('#auth-view')).toBeVisible();
  });

  test('quick demo access works from auth page', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator('#btn-landing-get-started').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#auth-view')).toBeVisible({ timeout: 5_000 });

    const demoBtn = page.locator('#btn-auth-quick-demo');
    await demoBtn.click();
    await page.waitForLoadState('networkidle');
    // Should show demo badge
    await expect(page.locator('#demo-mode-badge')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Auth State Guards', () => {
  test('unauthenticated user sees landing page', async ({ page }) => {
    await waitForAppReady(page);
    // Should see landing CTA buttons
    await expect(page.locator('#btn-landing-get-started')).toBeVisible({ timeout: 10_000 });
  });

  test('demo user sees demo badge', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator('#btn-landing-demo').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#demo-mode-badge')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Demo Data Isolation', () => {
  test('demo mode uses local storage only', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator('#btn-landing-demo').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#demo-mode-badge')).toBeVisible({ timeout: 5_000 });

    // Verify demo user ID is in localStorage
    const userId = await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('ai_fitness_os_current_user') || '{}');
      return user.id;
    });
    expect(userId).toMatch(/^demo_/);
  });

  test('demo data is seeded locally', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator('#btn-landing-demo').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#demo-mode-badge')).toBeVisible({ timeout: 5_000 });

    // Check that measurements exist in localStorage
    const hasMeasurements = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ai_fitness_os_measurements_')) {
          return true;
        }
      }
      return false;
    });
    expect(hasMeasurements).toBe(true);
  });
});
