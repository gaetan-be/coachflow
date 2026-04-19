import { test, expect } from '@playwright/test';

const COACH_EMAIL = process.env.COACH_EMAIL || 'coach@test.be';
const COACH_PASSWORD = process.env.COACH_PASSWORD || 'testpassword123';

test.describe('Coach login', () => {
  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/coach');
    await page.fill('input[name="email"], input[type="email"]', COACH_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error, [data-error], #error-msg')).toBeVisible({ timeout: 3000 });
  });

  test('redirects to /backoffice after successful login', async ({ page }) => {
    await page.goto('/coach');
    await page.fill('input[name="email"], input[type="email"]', COACH_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', COACH_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/backoffice', { timeout: 5000 });
    expect(page.url()).toContain('/backoffice');
  });

  test('navigating to /backoffice without session redirects to /coach', async ({ page }) => {
    await page.goto('/backoffice');
    await page.waitForURL('**/coach', { timeout: 3000 });
    expect(page.url()).toContain('/coach');
  });

  test('logout clears session and redirects to /coach', async ({ page }) => {
    // Login first
    await page.goto('/coach');
    await page.fill('input[name="email"], input[type="email"]', COACH_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', COACH_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/backoffice');

    // Trigger logout
    await page.click('[data-action="logout"], #logout-btn, button:has-text("Déconnexion")');
    await page.waitForURL('**/coach', { timeout: 3000 });
    expect(page.url()).toContain('/coach');

    // Confirm session is gone
    await page.goto('/backoffice');
    await page.waitForURL('**/coach', { timeout: 3000 });
  });
});
