import type { Page, Locator } from '@playwright/test';

export class BookingConfirmationPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly noteInput: Locator;
  readonly bookButton: Locator;
  readonly backButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel('Имя');
    this.emailInput = page.getByLabel('Email');
    this.noteInput = page.getByLabel('Заметки');
    this.bookButton = page.getByRole('button', { name: 'Забронировать' });
    this.backButton = page.getByRole('button', { name: 'Назад' });
    this.successMessage = page.getByText('Бронирование подтверждено');
    this.errorMessage = page.locator('[role="alert"], [class*="Alert"]').first();
  }

  async goto(eventTypeId: string): Promise<void> {
    await this.page.goto(`/booking/${eventTypeId}/confirm`);
  }

  async fillGuestInfo(data: {
    name: string;
    email: string;
    note?: string;
  }): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    if (data.note) {
      await this.noteInput.fill(data.note);
    }
  }

  async submitBooking(): Promise<void> {
    await this.bookButton.click();
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  async expectSuccess(): Promise<void> {
    await this.successMessage.waitFor({ timeout: 10000 });
  }

  async expectError(): Promise<void> {
    await this.errorMessage.waitFor({ timeout: 10000 });
  }

  async getErrorText(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
}
