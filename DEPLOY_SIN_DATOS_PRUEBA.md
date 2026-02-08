# Guía para Desplegar la Aplicación sin Datos de Prueba

Esta guía te ayudará a desplegar la aplicación localmente sin ningún dato de prueba, lista para agregar datos reales.

## ✅ Cambios Realizados

### 1. **Eliminación de Datos de Prueba del Código**
Se han eliminado todos los datos de prueba del archivo `src/contexts/DataProvider.tsx`:
- ❌ Clientes de prueba (Juan Pérez, Maria Lopez, Carlos Ruiz)
- ❌ Reservaciones de prueba
- ❌ Transacciones de prueba

Ahora todos los arrays iniciales están vacíos:
```typescript
const INITIAL_CLIENTS: Client[] = [];
const INITIAL_RESERVATIONS: Reservation[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];
```

## 🧹 Pasos para Limpiar Datos Existentes

### Opción 1: Limpiar localStorage desde la Consola del Navegador

1. **Abre tu aplicación** en el navegador (http://localhost:5173)
2. **Abre las Herramientas de Desarrollo** (F12 o Ctrl+Shift+I)
3. **Ve a la pestaña "Console"**
4. **Copia y pega** el siguiente código:

```javascript
// Limpiar todos los datos de la aplicación
localStorage.removeItem('cg_clients');
localStorage.removeItem('cg_reservations');
localStorage.removeItem('cg_transactions');
console.log('✅ LocalStorage limpiado. Recarga la página.');
```

5. **Presiona Enter** para ejecutar
6. **Recarga la página** (F5 o Ctrl+R)

### Opción 2: Usar el Script Incluido

También se ha creado un archivo `clear-storage.js` en la raíz del proyecto. Para usarlo:

1. Abre las Herramientas de Desarrollo en tu navegador (F12)
2. Ve a la pestaña "Console"
3. Copia el contenido del archivo `clear-storage.js` y pégalo en la consola
4. Presiona Enter
5. Recarga la página

### Opción 3: Limpiar Manualmente desde DevTools

1. Abre las Herramientas de Desarrollo (F12)
2. Ve a la pestaña **"Application"** (o "Aplicación")
3. En el panel izquierdo, expande **"Local Storage"**
4. Haz clic en tu dominio (http://localhost:5173)
5. Busca y elimina las siguientes claves:
   - `cg_clients`
   - `cg_reservations`
   - `cg_transactions`
6. Recarga la página

## 🚀 Verificación

Después de limpiar el localStorage y recargar la página, deberías ver:

- ✅ **Dashboard**: Sin datos, mostrando gráficos vacíos
- ✅ **Clientes**: Lista vacía, lista para agregar nuevos clientes
- ✅ **Reservaciones**: Sin reservaciones, calendario limpio
- ✅ **Finanzas**: Sin transacciones, listo para registrar ingresos/gastos

## 📝 Notas Importantes

### Datos de Prueba vs Datos de Producción

- **Datos de Prueba**: Solo se usan en los archivos de test (`src/test/mocks/data.mock.ts`)
- **Datos de Producción**: Ahora la aplicación inicia completamente vacía
- **localStorage**: Los datos se guardan en el navegador del usuario

### Si usas Supabase

Si planeas usar Supabase en el futuro:
- El schema SQL (`supabase/schema.sql`) **NO** contiene datos de prueba
- Las tablas se crearán vacías
- Solo necesitas ejecutar el schema para crear las tablas

### Modo de Desarrollo vs Producción

Esta configuración es válida tanto para:
- ✅ Desarrollo local (`npm run dev`)
- ✅ Build de producción (`npm run build`)

## 🔄 Para Volver a Agregar Datos de Prueba (Solo Desarrollo)

Si en el futuro necesitas datos de prueba para desarrollo, puedes:

1. Abrir la consola del navegador
2. Ejecutar este código para agregar un cliente de ejemplo:

```javascript
const testClient = {
  id: 'test-1',
  name: 'Cliente de Prueba',
  email: 'prueba@example.com',
  phone: '+52 555 000 0000'
};

const clients = JSON.parse(localStorage.getItem('cg_clients') || '[]');
clients.push(testClient);
localStorage.setItem('cg_clients', JSON.stringify(clients));
location.reload();
```

## ✨ Resumen

Tu aplicación ahora está configurada para:
- ✅ Iniciar sin datos de prueba
- ✅ Estar lista para datos reales
- ✅ Funcionar correctamente en desarrollo y producción
- ✅ Mantener los datos de prueba solo en los archivos de test

---

**¿Necesitas ayuda?** Si encuentras algún problema, verifica que hayas limpiado correctamente el localStorage siguiendo los pasos anteriores.
