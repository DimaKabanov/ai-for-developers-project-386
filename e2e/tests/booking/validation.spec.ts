import { test, expect } from '@playwright/test';
import { BookingConfirmationPage } from '../../pages/BookingConfirmationPage';
import { SlotSelectionPage } from '../../pages/SlotSelectionPage';
import { findAvailableSlot } from '../../fixtures/setup';

test.describe('Booking Form Validation', () => {
  const eventTypeId = 'meeting-15min-a7x9k2m3';

  test.beforeEach(async ({ page }) => {
    // Navigate to confirmation page with pre-selected slot
    const slotSelectionPage = new SlotSelectionPage(page);
    await slotSelectionPage.goto(eventTypeId);
    await slotSelectionPage.selectTomorrow();
    await slotSelectionPage.selectFirstAvailableSlot();
    await slotSelectionPage.clickContinue();
  });

  test('shows validation error for empty name', async ({ page }) => {
    const confirmationPage = new BookingConfirmationPage(page);

    await confirmationPage.emailInput.fill('test@example.com');
    await confirmationPage.submitBooking();

    // Check for validation error
    const errorText = await confirmationPage.nameInput.locator('xpath=following::*[contains(text(), "Имя") or contains(text(), "обязательно") or contains(@class, "error")]').first().textContent();
    expect(errorText?.toLowerCase()).toMatch(/имя|обязательно|required/i);
  });

  test('shows validation error for empty email', async ({ page }) => {
    const confirmationPage = new BookingConfirmationPage(page);

    await confirmationPage.nameInput.fill('Test User');
    await confirmationPage.submitBooking();

    // Check for validation error
    const errorText = await confirmationPage.emailInput.locator('xpath=following::*[contains(text(), "Email") or contains(text(), "обязательно") or contains(@class, "error")]').first().textContent();
    expect(errorText?.toLowerCase()).toMatch(/email|обязательно|required/i);
  });

  test('shows validation error for invalid email format', async ({ page }) => {
    const confirmationPage = new BookingConfirmationPage(page);

    await confirmationPage.nameInput.fill('Test User');
    await confirmationPage.emailInput.fill('not-an-email');
    await confirmationPage.submitBooking();

    // Check for validation error
    const errorText = await confirmationPage.emailInput.locator('xpath=following::*[contains(text(), "Email") or contains(text(), "корректный") or contains(@class, "error")]').first().textContent();
    expect(errorText?.toLowerCase()).toMatch(/email|корректный|invalid/i);
  });

  test('accepts booking with minimum valid data', async ({ page }) => {
    const confirmationPage = new BookingConfirmationPage(page);

    await confirmationPage.fillGuestInfo({
      name: 'AB',
      email: 'test@example.com'
    });
    await confirmationPage.submitBooking();

    await confirmationPage.expectSuccess();
  });
});
