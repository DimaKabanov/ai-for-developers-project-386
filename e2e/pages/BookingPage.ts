import type { Page, Locator } from '@playwright/test';

export class BookingPage {
  readonly page: Page;
  readonly eventTypeCards: Locator;
  readonly ownerName: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eventTypeCards = page.locator('[class*="Card"], [class*="card"]').filter({ has: page.locator('text=/\\d+ мин/') });
    this.ownerName = page.locator('text=/Tota|Загрузка/').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/booking');
    await this.page.waitForSelector('text=Выберите тип события', { timeout: 10000 });
  }

  async selectEventType(name: string): Promise<void> {
    const card = this.page.locator('text=' + name).locator('xpath=ancestor::*[contains(@class, "Card") or contains(@class, "card")][1]');
    await card.click();
  }

  async selectEventTypeByPartialName(namePattern: string): Promise<void> {
    const card = this.page.getByText(namePattern, { exact: false }).first();
    await card.click();
  }

  async getEventTypeCount(): Promise<number> {
    return await this.eventTypeCards.count();
  }
}
