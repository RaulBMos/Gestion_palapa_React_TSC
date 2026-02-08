/**
 * Script para limpiar localStorage
 * Ejecutar este script en la consola del navegador para eliminar todos los datos de prueba
 */

// Limpiar todos los datos de la aplicación
localStorage.removeItem('cg_clients');
localStorage.removeItem('cg_reservations');
localStorage.removeItem('cg_transactions');

console.log('✅ LocalStorage limpiado. Recarga la página para empezar con datos vacíos.');
