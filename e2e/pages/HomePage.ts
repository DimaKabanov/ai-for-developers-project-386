import type { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly bookingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bookingButton = page.getByRole('button', { name: /Записаться|Записаться на звонок/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async clickBookMeeting(): Promise<void> {
    await this.bookingButton.click();
  }
}
