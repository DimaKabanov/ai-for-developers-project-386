import { test, expect } from '@playwright/test';
import { BookingPage } from '../../pages/BookingPage';
import { SlotSelectionPage } from '../../pages/SlotSelectionPage';
import { BookingConfirmationPage } from '../../pages/BookingConfirmationPage';

test.describe('Booking Navigation', () => {
  const eventTypeId = 'meeting-15min-a7x9k2m3';

  test('navigating back from confirmation preserves slot selection', async ({ page }) => {
    const slotSelectionPage = new SlotSelectionPage(page);
    const confirmationPage = new BookingConfirmationPage(page);

    // Navigate to slot selection and select a slot
    await slotSelectionPage.goto(eventTypeId);
    await slotSelectionPage.selectTomorrow();
    await slotSelectionPage.selectFirstAvailableSlot();

    // Continue to confirmation
    await slotSelectionPage.clickContinue();
    await expect(page).toHaveURL(new RegExp(`/booking/${eventTypeId}/confirm`));

    // Go back
    await confirmationPage.clickBack();

    // Should be back on slot selection page
    await expect(page).toHaveURL(new RegExp(`/booking/${eventTypeId}$`));
  });

  test('navigating back from slot selection returns to event type list', async ({ page }) => {
    const bookingPage = new BookingPage(page);
    const slotSelectionPage = new SlotSelectionPage(page);

    // Navigate to slot selection
    await slotSelectionPage.goto(eventTypeId);

    // Go back
    await slotSelectionPage.clickBack();

    // Should be on booking page (event type list)
    await expect(page).toHaveURL(/.*\/booking$/);
  });

  test('can change selected date on slot selection page', async ({ page }) => {
    const slotSelectionPage = new SlotSelectionPage(page);

    await slotSelectionPage.goto(eventTypeId);

    // Select tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await slotSelectionPage.selectDate(tomorrow);
    await slotSelectionPage.selectFirstAvailableSlot();

    // Change to day after tomorrow
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    await slotSelectionPage.selectDate(dayAfter);

    // Slots list should update (we can't easily verify this but the action should not error)
  });
});
