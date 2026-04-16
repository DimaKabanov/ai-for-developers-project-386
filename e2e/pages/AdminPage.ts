import type { Page, Locator } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly saveButton: Locator;
  readonly idInput: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly durationInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: '+ Новый тип' });
    this.saveButton = page.getByRole('button', { name: 'Создать' });
    this.idInput = page.getByLabel('ID');
    this.nameInput = page.getByLabel('Название');
    this.descriptionInput = page.getByLabel('Описание');
    this.durationInput = page.locator('input[type="number"], [class*="duration"]').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
    await this.page.waitForSelector('text=Типы событий', { timeout: 10000 });
  }

  async createEventType(data: {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
  }): Promise<void> {
    await this.createButton.click();
    await this.idInput.fill(data.id);
    await this.nameInput.fill(data.name);
    await this.descriptionInput.fill(data.description);
    await this.saveButton.click();
  }

  async deleteEventType(name: string): Promise<void> {
    const eventCard = this.page.locator('[class*="eventTypeCard"], [class*="Card"]').filter({ hasText: name }).first();
    await eventCard.locator('button').nth(1).click();
    const deleteButton = this.page.getByRole('button', { name: 'Удалить' });
    await deleteButton.click();
  }

  async expectEventTypeVisible(name: string): Promise<void> {
    await this.page.getByText(name).waitFor({ timeout: 10000 });
  }

  async expectEventTypeNotVisible(name: string): Promise<void> {
    await this.page.getByText(name).waitFor({ state: 'detached', timeout: 10000 });
  }
}
