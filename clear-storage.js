/**
 * Script para limpiar localStorage
 * Ejecutar este script en la consola del navegador para eliminar todos los datos de prueba
 */

(() => {
  const storage = typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : undefined;

  if (!storage) {
    globalThis.console?.warn?.('ℹ️ localStorage no está disponible en este entorno');
    return;
  }
  storage.removeItem('cg_clients');
  storage.removeItem('cg_reservations');
  storage.removeItem('cg_transactions');

  globalThis.console?.log?.('✅ LocalStorage limpiado. Recarga la página para empezar con datos vacíos.');
})();
