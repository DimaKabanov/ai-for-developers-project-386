import type { Page, Locator } from '@playwright/test';

export class SlotSelectionPage {
  readonly page: Page;
  readonly calendar: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly slotsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.calendar = page.locator('[role="dialog"], [class*="DatePicker"]').first();
    this.continueButton = page.getByRole('button', { name: 'Продолжить' });
    this.backButton = page.getByRole('button', { name: 'Назад' });
    this.slotsList = page.locator('text=Статус слотов').locator('xpath=following::*').locator('[class*="slot"], button:has-text(":")').first();
  }

  async goto(eventTypeId: string): Promise<void> {
    await this.page.goto(`/booking/${eventTypeId}`);
    await this.page.waitForSelector('text=Календарь', { timeout: 10000 });
  }

  async selectDate(date: Date): Promise<void> {
    const day = date.getDate();
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    // Format: "17 апреля 2026"
    const dateLabel = `${day} ${monthName} ${year}`;

    // Click on the button with the full date label
    const dateButton = this.page.getByRole('button', { name: dateLabel, exact: true });
    await dateButton.click();
  }

  async selectTomorrow(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await this.selectDate(tomorrow);
  }

  async selectTime(time: string): Promise<void> {
    const timeButton = this.page.locator(`text=${time}`).first();
    await timeButton.click();
  }

  async selectFirstAvailableSlot(): Promise<void> {
    const availableSlot = this.page.locator('text=Свободно').first();
    await availableSlot.locator('xpath=ancestor::*[contains(@class, "Paper") or contains(@class, "slot")][1]').click();
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  async getSelectedDate(): Promise<string> {
    const dateElement = this.page.locator('text=/\\d{1,2}\\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i').first();
    return await dateElement.textContent() || '';
  }
}
