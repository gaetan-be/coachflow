import { test, expect, Page } from '@playwright/test';

const COACH_EMAIL = process.env.COACH_EMAIL || 'coach@test.be';
const COACH_PASSWORD = process.env.COACH_PASSWORD || 'testpassword123';

async function loginCoach(page: Page) {
  await page.goto('/coach');
  await page.fill('input[name="email"], input[type="email"]', COACH_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', COACH_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/backoffice', { timeout: 5000 });
}

async function createCoachee(page: Page): Promise<string> {
  // Submit a questionnaire to get a real coachee id
  const res = await page.request.post('/api/questionnaire', {
    data: {
      prenom: 'TestE2E',
      nom: 'Dupont',
      date_naissance: '2006-06-15',
    },
  });
  const { id } = await res.json();
  return String(id);
}

test.describe('Pipeline — coachee editor', () => {
  test.beforeEach(async ({ page }) => {
    await loginCoach(page);
  });

  test('loads coachee data into the form', async ({ page }) => {
    const id = await createCoachee(page);
    await page.goto(`/backoffice/coachee/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[name="prenom"], #prenom')).toHaveValue('TestE2E', { timeout: 5000 });
  });

  test('saves updated fields to the server', async ({ page }) => {
    const id = await createCoachee(page);
    await page.goto(`/backoffice/coachee/${id}`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="prenom"], #prenom', 'TestUpdated');
    await page.click('[data-action="save"], #btn-save, button:has-text("Sauvegarder")');

    // Wait for save confirmation
    await expect(page.locator('.save-indicator, .saved, [data-saved]')).toBeVisible({ timeout: 3000 }).catch(() => {});

    // Reload and confirm persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[name="prenom"], #prenom')).toHaveValue('TestUpdated', { timeout: 5000 });
  });

  test('queues a report and shows pending status', async ({ page }) => {
    const id = await createCoachee(page);
    await page.goto(`/backoffice/coachee/${id}`);
    await page.waitForLoadState('networkidle');

    // Intercept the report API to avoid actually queuing (no worker running in E2E)
    await page.route(`/api/coachee/${id}/report`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.click('[data-action="make-report"], #btn-make-report, button:has-text("Créer le rapport")');

    // The UI should reflect "queued" state
    await expect(
      page.locator(':has-text("En attente"), :has-text("En cours"), .status-queued, .status-processing, [data-status]')
    ).toBeVisible({ timeout: 3000 });
  });

  test('shows download button when report is done', async ({ page }) => {
    const id = await createCoachee(page);

    // Inject a done report directly via API (requires auth)
    await page.request.post(`/api/coachee/${id}/report`).catch(() => {});

    // Simulate done status by intercepting the coachee API
    await page.route(`/api/coachee/${id}`, async (route) => {
      const original = await route.fetch();
      const body = await original.json();
      body.report_status = 'done';
      await route.fulfill({ json: body });
    });

    await page.goto(`/backoffice/coachee/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('[data-action="download"], #btn-download, a:has-text("Télécharger")')
    ).toBeVisible({ timeout: 5000 });
  });
});
