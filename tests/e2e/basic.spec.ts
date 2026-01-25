import { test, expect } from '@playwright/test';

test.describe('Basic App Loading', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Esperar a que la aplicación cargue
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Verificar que hay contenido visible
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
    
    // Tomar screenshot para depuración
    await page.screenshot({ path: 'test-results/app-loaded.png' });
  });

  test('should find the Nueva Reserva button', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Esperar a que cargue la página
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForTimeout(2000); // Esperar extra para que renderice
    
    // Tomar screenshot antes de buscar el botón
    await page.screenshot({ path: 'test-results/before-search.png' });
    
    // Buscar el botón con múltiples estrategias
    const buttonFound = await Promise.any([
      page.locator('button:has-text("Nueva Reserva")').isVisible(),
      page.locator('button', { hasText: 'Nueva Reserva' }).isVisible(),
      page.locator('text=Nueva Reserva').isVisible(),
      page.locator('[data-testid*="reserva"]').isVisible()
    ]).catch(() => false);
    
    console.log('Button found:', buttonFound);
    
    // Tomar screenshot después de buscar
    await page.screenshot({ path: 'test-results/after-search.png' });
    
    // Buscar cualquier botón para debug
    const allButtons = await page.locator('button').all();
    console.log('Total buttons found:', allButtons.length);
    
    for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      console.log(`Button ${i}:`, text);
    }
  });
});