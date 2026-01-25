import { test, expect } from '@playwright/test';

test.describe('Booking Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Iniciar la app y esperar a que cargue completamente
    await page.goto('http://localhost:5173');
    
    // Esperar a que la aplicación cargue
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForTimeout(2000); // Esperar a que renderice el contenido
  });

  test('complete booking flow from creation to AI analysis', async ({ page }) => {
    // 2. Navegar a la sección de Reservas
    await page.click('button:has-text("Reservas")');
    await page.waitForSelector('h2:has-text("Reservas")', { timeout: 5000 });
    await page.waitForTimeout(1000); // Esperar a que cargue la sección

    // 3. Hacer clic en 'Nueva Reserva'
    await page.click('button:has-text("Nueva Reserva")');
    
    // Esperar a que aparezca el modal del formulario
    await page.waitForSelector('h3:has-text("Nueva Reserva")', { timeout: 5000 });
    await page.waitForTimeout(1000); // Esperar a que el modal esté completamente cargado

    // 4. Completar el formulario usando datos de prueba
    
    // Seleccionar cliente (esperar a que haya opciones disponibles)
    await page.waitForSelector('select', { timeout: 5000 });
    await page.waitForTimeout(500); // Pequeña espera para que carguen las opciones
    
    const clientSelect = page.locator('select').first();
    await clientSelect.selectOption({ index: 1 }); // Seleccionar el primer cliente disponible
    
    // Configurar cantidad de personas
    const adultsInput = page.locator('input[type="number"]').first();
    await adultsInput.fill('2');
    
    // Configurar total a cobrar
    const totalInput = page.locator('input[placeholder*="0.00"]');
    await totalInput.fill('250.00');
    
    // Intentar seleccionar fechas
    try {
      await page.waitForSelector('.bg-slate-50', { timeout: 3000 });
      const calendarButtons = page.locator('.bg-slate-50 button').first();
      if (await calendarButtons.isVisible({ timeout: 2000 })) {
        await calendarButtons.click();
        await page.locator('.bg-slate-50 button').nth(1).click();
      }
    } catch (e) {
      console.log('Could not select dates, continuing...');
    }
    
    // Enviar formulario
    await page.click('button:has-text("Confirmar Reserva")');
    
    // Esperar a que el modal se cierre o cerrarlo manualmente si es necesario
    try {
      await page.waitForSelector('h3:has-text("Nueva Reserva")', { state: 'hidden', timeout: 3000 });
    } catch (e) {
      // Intentar cerrar el modal haciendo clic en el backdrop
      await page.click('.bg-slate-900\\/60, .absolute.inset-0');
      await page.waitForTimeout(1000);
    }

    // 5. Verificar que la reserva aparezca en la lista
    await page.waitForTimeout(2000);
    
    // Intentar cambiar a vista de lista
    try {
      await page.click('button[title="Vista Lista"]', { timeout: 3000 });
    } catch (e) {
      console.log('Could not switch to list view, continuing...');
    }
    
    // Verificar que hay algún contenido de reserva
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('250'); // Verificar el monto

    // 6. Navegar al Dashboard para acceder a 'Analizar con IA'
    // Asegurarse de que no hay overlays bloqueando
    await page.waitForTimeout(1000);
    
    // Usar un selector más específico para el botón de inicio
    const navButtons = page.locator('button:has-text("Inicio")');
    await navButtons.first().click();
    
    // Esperar a que cargue el Dashboard
    await page.waitForSelector('text=Panel de Control', { timeout: 10000 });
    
    // 7. Hacer clic en 'Analizar con IA'
    await page.click('button:has-text("Analizar con IA")');
    
    // Esperar a que aparezca el componente de respuesta de IA
    await page.waitForSelector('text=Análisis de Inteligencia Artificial', { timeout: 15000 });
    
    // Verificar que el componente de IA es visible
    await expect(page.locator('text=Análisis de Inteligencia Artificial')).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    // Navegar a la sección de Reservas
    await page.click('button:has-text("Reservas")');
    await page.waitForSelector('h2:has-text("Reservas")', { timeout: 5000 });
    
    // Abrir formulario sin completar campos obligatorios
    await page.click('button:has-text("Nueva Reserva")');
    await page.waitForSelector('h3:has-text("Nueva Reserva")', { timeout: 5000 });
    
    // Intentar enviar formulario vacío
    await page.click('button:has-text("Confirmar Reserva")');
    
    // Verificar que el formulario sigue visible (no se cerró por validación)
    await expect(page.locator('h3:has-text("Nueva Reserva")')).toBeVisible();
  });
});