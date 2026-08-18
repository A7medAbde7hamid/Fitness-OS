import { Page, expect } from '@playwright/test';

export async function waitForAppReady(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
}

export async function waitForDemoMode(page: Page): Promise<void> {
  await waitForAppReady(page);

  // The landing page has "Try Live Demo Mode" button
  const landingDemoBtn = page.locator('#btn-landing-demo');
  if (await landingDemoBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await landingDemoBtn.click();
    await page.waitForLoadState('networkidle');
    return;
  }

  // Fallback: auth page has "Quick Demo Access" button
  const authDemoBtn = page.locator('#btn-auth-quick-demo');
  if (await authDemoBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await authDemoBtn.click();
    await page.waitForLoadState('networkidle');
    return;
  }

  // Fallback: text-based search
  const demoBtn = page.getByRole('button', { name: /demo|تجرب/i }).first();
  if (await demoBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await demoBtn.click();
    await page.waitForLoadState('networkidle');
  }
}

export async function expectMetaContent(page: Page, name: string, expected: string): Promise<void> {
  const content = await page.locator(`meta[name="${name}"]`).getAttribute('content');
  expect(content).toBe(expected);
}

export async function expectHasText(page: Page, ...texts: string[]): Promise<void> {
  const body = page.locator('body');
  for (const text of texts) {
    if (await body.getByText(text, { exact: false }).isVisible().catch(() => false)) {
      return;
    }
  }
  throw new Error(`Expected one of [${texts.join(', ')}] to be visible`);
}
