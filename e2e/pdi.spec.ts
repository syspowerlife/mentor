import { test, expect } from '@playwright/test';

test.describe('PDI Flow', () => {
  test('should allow creating a new PDI', async ({ page }) => {
    await page.goto('/ferramentas/pdi');
    
    // Click new PDI button
    await page.click('text=Novo PDI');
    
    // Fill PDI details
    await page.fill('input[name="data_inicio"]', '2024-01-01');
    await page.fill('input[name="data_fim"]', '2024-12-31');
    
    // Submit
    await page.click('button[type="submit"]');
  });
});
