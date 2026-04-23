import { test, expect } from '@playwright/test';

test.describe('Evaluation Flow', () => {
  test('should allow creating a session evaluation', async ({ page }) => {
    await page.goto('/ferramentas/avaliacao-cliente');
    
    // Select a client (assuming there's a select or input)
    // await page.selectOption('select[name="cliente_id"]', 'client123');
    
    // Set rating
    // await page.click('button[aria-label="Rate 5 stars"]');
    
    // Fill feedback
    await page.fill('textarea[name="pontosPositivos"]', 'Ótima sessão, muito produtiva.');
    await page.fill('textarea[name="pontosMelhoria"]', 'Podemos focar mais em metas de longo prazo.');
    
    // Submit
    await page.click('button[type="submit"]');
  });
});
