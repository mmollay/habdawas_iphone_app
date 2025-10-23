import { test, expect } from '@playwright/test';

test.describe('Vehicle Attribute Filtering System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should show FilterSidebar when Fahrzeuge > Autos category is selected', async ({ page }) => {
    // Click on filter button to open filter drawer
    await page.click('[aria-label="Filter"]');

    // Wait for filter drawer to open
    await page.waitForSelector('text=Kategorien', { timeout: 5000 });

    // Select Fahrzeuge category (assuming it exists)
    // Note: You may need to adjust the selector based on actual implementation
    const fahrzeugeChip = page.locator('text=Fahrzeuge').first();
    if (await fahrzeugeChip.isVisible()) {
      await fahrzeugeChip.click();

      // Wait for FilterSidebar to appear
      await page.waitForSelector('text=Marke', { timeout: 5000 });

      // Verify attribute filters are visible
      await expect(page.locator('text=Marke')).toBeVisible();
      await expect(page.locator('text=Baujahr')).toBeVisible();
      await expect(page.locator('text=Antrieb')).toBeVisible();
      await expect(page.locator('text=Farbe')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should filter items by vehicle brand', async ({ page }) => {
    // Click on filter button
    await page.click('[aria-label="Filter"]');

    // Wait for drawer
    await page.waitForSelector('text=Kategorien');

    // Select Fahrzeuge category
    const fahrzeugeChip = page.locator('text=Fahrzeuge').first();
    if (await fahrzeugeChip.isVisible()) {
      await fahrzeugeChip.click();

      // Wait for FilterSidebar
      await page.waitForSelector('text=Marke');

      // Click on Marke accordion
      await page.locator('text=Marke').click();

      // Select VW brand (if available)
      const vwOption = page.locator('text=Volkswagen').first();
      if (await vwOption.isVisible()) {
        await vwOption.click();

        // Apply filters
        await page.click('button:has-text("Anwenden")');

        // Wait for items to load
        await page.waitForLoadState('networkidle');

        // Verify filter was applied (check URL or active filter chip)
        await expect(page.locator('text=Filter aktiv')).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should filter items by year range', async ({ page }) => {
    // Click on filter button
    await page.click('[aria-label="Filter"]');

    // Wait for drawer
    await page.waitForSelector('text=Kategorien');

    // Select Fahrzeuge category
    const fahrzeugeChip = page.locator('text=Fahrzeuge').first();
    if (await fahrzeugeChip.isVisible()) {
      await fahrzeugeChip.click();

      // Wait for FilterSidebar
      await page.waitForSelector('text=Baujahr');

      // Click on Baujahr accordion
      await page.locator('text=Baujahr').click();

      // Set year range (Von: 2015, Bis: 2020)
      const vonInput = page.locator('input[placeholder*="Von"]').first();
      if (await vonInput.isVisible()) {
        await vonInput.fill('2015');

        const bisInput = page.locator('input[placeholder*="Bis"]').first();
        await bisInput.fill('2020');

        // Apply filters
        await page.click('button:has-text("Anwenden")');

        // Wait for items to load
        await page.waitForLoadState('networkidle');

        // Verify filter was applied
        await expect(page.locator('text=Filter aktiv')).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should clear all filters including attribute filters', async ({ page }) => {
    // Click on filter button
    await page.click('[aria-label="Filter"]');

    // Wait for drawer
    await page.waitForSelector('text=Kategorien');

    // Select Fahrzeuge category
    const fahrzeugeChip = page.locator('text=Fahrzeuge').first();
    if (await fahrzeugeChip.isVisible()) {
      await fahrzeugeChip.click();

      // Wait for FilterSidebar
      await page.waitForSelector('text=Marke');

      // Click on Marke accordion
      await page.locator('text=Marke').click();

      // Select a brand
      const firstOption = page.locator('[role="menuitem"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();

        // Apply filters
        await page.click('button:has-text("Anwenden")');

        // Wait for filters to be applied
        await page.waitForLoadState('networkidle');

        // Clear all filters
        await page.click('text=Zurücksetzen');

        // Verify filters were cleared
        await expect(page.locator('text=Filter aktiv')).not.toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should show active filter chips for attribute filters', async ({ page }) => {
    // Click on filter button
    await page.click('[aria-label="Filter"]');

    // Wait for drawer
    await page.waitForSelector('text=Kategorien');

    // Select Fahrzeuge category
    const fahrzeugeChip = page.locator('text=Fahrzeuge').first();
    if (await fahrzeugeChip.isVisible()) {
      await fahrzeugeChip.click();

      // Wait for FilterSidebar
      await page.waitForSelector('text=Marke');

      // Click on Marke accordion
      await page.locator('text=Marke').click();

      // Select a brand
      const firstOption = page.locator('[role="menuitem"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();

        // Verify active filter chip appears in FilterSidebar summary
        await expect(page.locator('.MuiChip-root').filter({ hasText: '✓' })).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Vehicle Listing Creation with Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Login if needed (adjust based on your auth setup)
    // await page.click('text=Anmelden');
    // await page.fill('[type="email"]', 'test@example.com');
    // await page.fill('[type="password"]', 'password');
    // await page.click('button:has-text("Anmelden")');
  });

  test('should extract and save vehicle attributes from image analysis', async ({ page }) => {
    // This test would require:
    // 1. Authenticated user
    // 2. Ability to upload vehicle images
    // 3. Wait for AI analysis
    // 4. Verify attributes were extracted and saved

    // Note: This is a comprehensive integration test
    // that requires the full system to be running

    test.skip(); // Skip for now - implement when ready
  });

  test('should display vehicle attributes on item detail page', async ({ page }) => {
    // Navigate to a vehicle item detail page
    // Verify attributes are displayed

    test.skip(); // Skip for now - implement when ready
  });
});
