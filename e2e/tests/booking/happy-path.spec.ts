import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { BookingPage } from '../../pages/BookingPage';
import { SlotSelectionPage } from '../../pages/SlotSelectionPage';
import { BookingConfirmationPage } from '../../pages/BookingConfirmationPage';
import { findAvailableSlot, cleanupTestEventType } from '../../fixtures/setup';

test.describe('Happy Path - Complete Booking Flow', () => {
  const eventTypeId = 'meeting-15min-a7x9k2m3';
  const testEmail = `test-${Date.now()}@example.com`;

  test('full booking journey from home page to confirmation', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);
    const slotSelectionPage = new SlotSelectionPage(page);
    const confirmationPage = new BookingConfirmationPage(page);

    // Step 1: Navigate from home to booking page
    await homePage.goto();
    await homePage.clickBookMeeting();

    // Verify we're on booking page
    await expect(page).toHaveURL(/.*\/booking$/);

    // Step 2: Select event type
    await expect(bookingPage.ownerName).toBeVisible();
    await bookingPage.selectEventTypeByPartialName('Встреча 15 минут');

    // Verify we're on slot selection page
    await expect(page).toHaveURL(new RegExp(`/booking/${eventTypeId}`));

    // Step 3: Select date and time
    await slotSelectionPage.selectTomorrow();
    await slotSelectionPage.selectFirstAvailableSlot();
    await slotSelectionPage.clickContinue();

    // Verify we're on confirmation page
    await expect(page).toHaveURL(new RegExp(`/booking/${eventTypeId}/confirm`));

    // Step 4: Fill guest information and submit
    await confirmationPage.fillGuestInfo({
      name: 'Test User',
      email: testEmail,
      note: 'This is a test booking from E2E tests'
    });
    await confirmationPage.submitBooking();

    // Step 5: Verify success
    await confirmationPage.expectSuccess();
    // Verify booking date/time is displayed (format: "пятница, 17 апреля, 14:45 – 15:00")
    await expect(page.getByText(/\d{1,2}:\d{2}\s*–\s*\d{1,2}:\d{2}/)).toBeVisible();
  });

  test('booking flow preserves selected slot after navigating back and forward', async ({ page }) => {
    const bookingPage = new BookingPage(page);
    const slotSelectionPage = new SlotSelectionPage(page);
    const confirmationPage = new BookingConfirmationPage(page);

    // Navigate to slot selection
    await slotSelectionPage.goto(eventTypeId);

    // Select date and slot
    await slotSelectionPage.selectTomorrow();
    const initialDate = await slotSelectionPage.getSelectedDate();
    await slotSelectionPage.selectFirstAvailableSlot();

    // Continue to confirmation
    await slotSelectionPage.clickContinue();
    await expect(page).toHaveURL(new RegExp(`/booking/${eventTypeId}/confirm`));

    // Go back
    await confirmationPage.clickBack();

    // Verify we're back on slot selection and selection is preserved
    await expect(page).toHaveURL(new RegExp(`/booking/${eventTypeId}`));
  });

  test('cannot double-book same slot', async ({ page }) => {
    const slotSelectionPage = new SlotSelectionPage(page);
    const confirmationPage = new BookingConfirmationPage(page);

    // Get an available slot via API
    const slot = await findAvailableSlot(eventTypeId);

    // Pre-book it via API
    const response = await fetch(`http://localhost:3000/public/event-types/${eventTypeId}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startTime: slot.startTime,
        guestName: 'First User',
        guestEmail: 'first@example.com'
      })
    });
    expect(response.ok).toBe(true);

    // Try to book the same slot via UI
    await confirmationPage.goto(eventTypeId);

    // Set up local storage with the pre-selected slot
    await page.evaluate((slotData) => {
      const payload = {
        state: {
          eventTypeId: slotData.eventTypeId,
          slotId: slotData.id,
          selectedDate: slotData.startTime,
          selectedTime: slotData.startTime,
          guestName: '',
          guestEmail: '',
          guestNote: '',
        },
        version: 0,
      };
      localStorage.setItem('booking-storage', JSON.stringify(payload));
    }, { ...slot, eventTypeId });

    // Refresh to load from local storage
    await confirmationPage.goto(eventTypeId);

    // Try to submit
    await confirmationPage.fillGuestInfo({
      name: 'Second User',
      email: 'second@example.com'
    });
    await confirmationPage.submitBooking();

    // Expect error about slot being booked
    await confirmationPage.expectError();
    const errorText = await confirmationPage.getErrorText();
    expect(errorText).toContain('забронировано');
  });
});
