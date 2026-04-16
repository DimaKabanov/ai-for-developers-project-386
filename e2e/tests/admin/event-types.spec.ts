import { test, expect } from '@playwright/test';
import { AdminPage } from '../../pages/AdminPage';
import { cleanupTestEventType } from '../../fixtures/setup';

test.describe('Admin Event Types CRUD', () => {
  const testIdPrefix = 'e2e-test';

  test.afterEach(async () => {
    // Cleanup any test event types
    const testTypes = ['e2e-test-event', 'e2e-updated-event'];
    for (const id of testTypes) {
      await cleanupTestEventType(id).catch(() => {});
    }
  });

  test('create a new event type', async ({ page }) => {
    const adminPage = new AdminPage(page);

    await adminPage.goto();
    await adminPage.createEventType({
      id: `${testIdPrefix}-event`,
      name: 'E2E Test Event',
      description: 'Created by E2E test',
      durationMinutes: 45
    });

    // Verify the event type appears in the list
    await adminPage.expectEventTypeVisible('E2E Test Event');
  });

  test('delete an event type', async ({ page }) => {
    const adminPage = new AdminPage(page);

    // First create an event type
    await adminPage.goto();
    await adminPage.createEventType({
      id: `${testIdPrefix}-event`,
      name: 'E2E Test Event',
      description: 'To be deleted',
      durationMinutes: 30
    });

    // Delete it
    await adminPage.deleteEventType('E2E Test Event');

    // Verify it's gone
    await adminPage.expectEventTypeNotVisible('E2E Test Event');
  });

  test('view upcoming bookings in admin', async ({ page }) => {
    await page.goto('/admin');

    // Check that bookings section is visible
    await expect(page.getByText('Предстоящие встречи')).toBeVisible();
  });
});
