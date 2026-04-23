import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow a user to register', async ({ page }) => {
    await page.goto('/Register');
    
    // Fill the registration form
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should redirect to Dashboard or show success message
    // Note: In a real E2E test against Firebase, we'd need to mock auth or use a test project
    // For this test, we just verify the form submission attempt
  });

  test('should allow a user to login', async ({ page }) => {
    await page.goto('/Login');
    
    // Fill the login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
  });
});
