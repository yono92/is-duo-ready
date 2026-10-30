import { expect, type Locator, type Page } from '@playwright/test';

// Exercise Astryx's accessible popover rather than mutating form values.
export async function selectOption(page: Page, field: Locator, label: string) {
  await field.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await field.click();
  const option = page.getByRole('option', { name: label, exact: true });
  await expect(option).toBeVisible();
  await option.click();
  await expect(field).toContainText(label);
}

// Astryx adds a localized required marker to the accessible field name.
export function fieldName(label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(String.raw`^${escaped}(?:\s*[∙·]?\s*(?:Required|필수))?$`);
}
