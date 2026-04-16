import { chromium } from 'playwright';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3000';

const consoleErrors = [];
const requestFailures = [];
const apiCalls = [];

const normalizePath = rawUrl => {
  const url = new URL(rawUrl);
  return url.pathname;
};

const hasCall = (method, path) => apiCalls.some(call => call.method === method && call.path === path);

const ensure = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const getAvailableSlot = async eventTypeId => {
  const response = await fetch(`${BACKEND_URL}/public/event-types/${eventTypeId}/slots`);
  ensure(response.ok, `Cannot fetch slots for ${eventTypeId}: ${response.status}`);
  const slots = await response.json();
  const available = slots.find(slot => slot.isAvailable);
  ensure(Boolean(available), `No available slots for ${eventTypeId}`);
  return available;
};

const setBookingStore = async (page, eventTypeId, slot) => {
  await page.evaluate(
    ({ etId, selectedSlot }) => {
      const payload = {
        state: {
          eventTypeId: etId,
          slotId: selectedSlot.id,
          selectedDate: selectedSlot.startTime,
          selectedTime: selectedSlot.startTime,
          guestName: '',
          guestEmail: '',
          guestNote: '',
        },
        version: 0,
      };
      localStorage.setItem('booking-storage', JSON.stringify(payload));
    },
    { etId: eventTypeId, selectedSlot: slot }
  );
};

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', message => {
    if (message.type() === 'error') {
      const text = message.text();
      if (text.includes('status of 409')) {
        return;
      }
      consoleErrors.push(text);
    }
  });

  page.on('requestfailed', request => {
    const failure = request.failure();
    if (failure?.errorText?.includes('net::ERR_ABORTED')) {
      return;
    }

    requestFailures.push({
      method: request.method(),
      url: request.url(),
      error: failure?.errorText,
    });
  });

  page.on('response', response => {
    if (!response.url().startsWith(BACKEND_URL)) {
      return;
    }

    apiCalls.push({
      method: response.request().method(),
      path: normalizePath(response.url()),
      status: response.status(),
    });
  });

  const eventTypeId = 'meeting-15min-a7x9k2m3';

  await page.goto(`${FRONTEND_URL}/booking`, { waitUntil: 'networkidle' });
  await page.locator('text=Встреча 15 минут').first().click();
  await page.waitForURL(new RegExp(`/booking/${eventTypeId}$`));
  await page.waitForLoadState('networkidle');

  const slot = await getAvailableSlot(eventTypeId);

  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
  await setBookingStore(page, eventTypeId, slot);
  await page.goto(`${FRONTEND_URL}/booking/${eventTypeId}/confirm`, { waitUntil: 'networkidle' });

  await page.getByLabel('Имя').fill('UI Smoke');
  await page.getByLabel('Email').fill('ui-smoke@example.com');
  await page.getByRole('button', { name: 'Забронировать' }).click();
  await page.getByText('Бронирование подтверждено').waitFor();

  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
  await setBookingStore(page, eventTypeId, slot);
  await page.goto(`${FRONTEND_URL}/booking/${eventTypeId}/confirm`, { waitUntil: 'networkidle' });
  await page.getByLabel('Имя').fill('UI Smoke Conflict');
  await page.getByLabel('Email').fill('ui-smoke-conflict@example.com');
  await page.getByRole('button', { name: 'Забронировать' }).click();
  await page.getByText('Это время уже забронировано').waitFor();

  await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '+ Новый тип' }).click();
  await page.getByLabel('ID').fill('evt-ui-smoke');
  await page.getByLabel('Название').fill('UI Smoke Event');
  await page.getByLabel('Описание').fill('Created in browser smoke test');
  await page.getByRole('button', { name: 'Создать' }).click();
  await page.getByText('UI Smoke Event').waitFor();

  const eventCard = page.locator('[class*="eventTypeCard"]', { hasText: 'UI Smoke Event' }).first();
  await eventCard.locator('button').first().click();
  await page.getByLabel('Название').fill('UI Smoke Event Updated');
  await page.getByLabel('Описание').fill('Updated in browser smoke test');
  await page.getByRole('button', { name: '60' }).first().click();
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await page.getByText('UI Smoke Event Updated').waitFor();

  const updatedCard = page
    .locator('[class*="eventTypeCard"]', { hasText: 'UI Smoke Event Updated' })
    .first();
  await updatedCard.locator('button').nth(1).click();
  await page.getByRole('button', { name: 'Удалить' }).click();
  await page
    .locator('[class*="eventTypeCard"]', { hasText: 'UI Smoke Event Updated' })
    .first()
    .waitFor({ state: 'detached' });

  const expectedCalls = [
    ['GET', '/public/owner'],
    ['GET', '/public/event-types'],
    ['GET', `/public/event-types/${eventTypeId}/slots`],
    ['POST', `/public/event-types/${eventTypeId}/bookings`],
    ['GET', '/admin/event-types'],
    ['POST', '/admin/event-types'],
    ['PUT', '/admin/event-types/evt-ui-smoke'],
    ['DELETE', '/admin/event-types/evt-ui-smoke'],
    ['GET', '/admin/bookings'],
  ];

  const missing = expectedCalls.filter(([method, path]) => !hasCall(method, path));

  await browser.close();

  console.log('--- UI Smoke Report ---');
  console.log(`API calls captured: ${apiCalls.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Request failures: ${requestFailures.length}`);

  if (consoleErrors.length > 0) {
    console.log('Console errors details:');
    consoleErrors.forEach(error => console.log(`- ${error}`));
  }

  if (requestFailures.length > 0) {
    console.log('Request failures details:');
    requestFailures.forEach(failure => {
      console.log(`- ${failure.method} ${failure.url} => ${failure.error}`);
    });
  }

  if (missing.length > 0) {
    console.log('Missing expected API calls:');
    missing.forEach(([method, path]) => console.log(`- ${method} ${path}`));
  }

  ensure(consoleErrors.length === 0, 'Console has errors');
  ensure(requestFailures.length === 0, 'Network has failed requests');
  ensure(missing.length === 0, 'Not all expected API methods were called');

  console.log('UI smoke test passed.');
};

run().catch(error => {
  console.error(error.message);
  process.exit(1);
});
