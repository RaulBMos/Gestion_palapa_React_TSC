# 🔍 Guía de Diagnóstico: Datos no se Guardan en Supabase

## 🎯 Problema
Has capturado datos en la aplicación pero no se reflejan en Supabase.

## ✅ Herramienta de Diagnóstico

Abre esta URL en tu navegador para ejecutar el diagnóstico automático:

```
http://localhost:5173/supabase-diagnostic.html
```

Esta herramienta verificará:
- ✅ Configuración de variables de entorno
- ✅ Conexión a Supabase
- ✅ Estado de las tablas
- ✅ Autenticación

## 🔍 Verificación Manual

### 1. Verifica tu archivo `.env.local`

Tu configuración actual:
```env
VITE_SUPABASE_URL=https://amnvnvsfoodmavlpcjbf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_v5Mr0DLtup_eB6F5BeTiCw_ij13SVAb
VITE_USE_SUPABASE=true
```

⚠️ **PROBLEMA DETECTADO**: Tu `VITE_SUPABASE_ANON_KEY` parece ser un placeholder o una clave incorrecta.

**Las claves de Supabase deberían:**
- Empezar con `eyJ...` (formato JWT)
- Tener más de 100 caracteres
- Ser obtenidas de tu proyecto en Supabase

### 2. Obtén las Credenciales Correctas

1. **Ve a tu proyecto en Supabase:**
   - https://app.supabase.com/project/amnvnvsfoodmavlpcjbf

2. **Ve a Settings → API:**
   - Copia el **Project URL** (debería ser el mismo que tienes)
   - Copia el **anon/public key** (esta es la clave correcta)

3. **Actualiza tu `.env.local`:**
   ```env
   VITE_SUPABASE_URL=https://amnvnvsfoodmavlpcjbf.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (tu clave real)
   VITE_USE_SUPABASE=true
   ```

### 3. Verifica que las Tablas Existan

1. **Ve a Table Editor en Supabase:**
   - https://app.supabase.com/project/amnvnvsfoodmavlpcjbf/editor

2. **Deberías ver estas tablas:**
   - ✅ `clients`
   - ✅ `reservations`
   - ✅ `transactions`
   - ✅ `system_config`

3. **Si NO existen, créalas:**
   - Ve a SQL Editor
   - Copia el contenido de `supabase/schema.sql`
   - Ejecuta el script

### 4. Verifica la Autenticación

**Problema común:** Supabase requiere que estés autenticado para guardar datos.

**Soluciones:**

#### Opción A: Deshabilitar RLS temporalmente (Solo desarrollo)
```sql
-- En SQL Editor de Supabase
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_config DISABLE ROW LEVEL SECURITY;
```

⚠️ **ADVERTENCIA:** Esto permite acceso público. Solo para desarrollo.

#### Opción B: Autenticarte en la aplicación
La aplicación necesita implementar autenticación. Por ahora, usa la Opción A.

### 5. Prueba la Conexión desde la Consola

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Importar Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amnvnvsfoodmavlpcjbf.supabase.co';
const supabaseKey = 'TU_CLAVE_REAL_AQUI'; // Reemplaza con tu clave real

const supabase = createClient(supabaseUrl, supabaseKey);

// Probar inserción
const { data, error } = await supabase
  .from('clients')
  .insert([
    { name: 'Test Cliente', email: 'test@example.com', phone: '1234567890' }
  ])
  .select();

console.log('Data:', data);
console.log('Error:', error);
```

## 🚀 Pasos Rápidos de Solución

### Paso 1: Obtén la Clave Correcta
1. Ve a https://app.supabase.com/project/amnvnvsfoodmavlpcjbf/settings/api
2. Copia el **anon public** key
3. Actualiza `.env.local`

### Paso 2: Recarga la Aplicación
```bash
# Detén el servidor (Ctrl+C)
# Vuelve a iniciar
npm run dev
```

### Paso 3: Ejecuta el Diagnóstico
Abre: http://localhost:5173/supabase-diagnostic.html

### Paso 4: Verifica en Supabase
1. Captura un dato en la aplicación
2. Ve a Table Editor en Supabase
3. Verifica que aparezca el dato

## 📊 Modo Fallback: LocalStorage

Si Supabase no funciona, puedes usar localStorage temporalmente:

**En `.env.local`:**
```env
VITE_USE_SUPABASE=false  # Cambiar a false
```

Esto guardará los datos localmente en tu navegador hasta que Supabase esté configurado.

## 🆘 Errores Comunes

### Error: "Invalid API key"
- ✅ Verifica que copiaste la clave completa
- ✅ Asegúrate de usar la **anon/public** key, no la **service_role** key

### Error: "relation 'clients' does not exist"
- ✅ Ejecuta `supabase/schema.sql` en SQL Editor

### Error: "new row violates row-level security policy"
- ✅ Deshabilita RLS temporalmente (ver Opción A arriba)
- ✅ O implementa autenticación

### Los datos se guardan pero no aparecen
- ✅ Verifica que estás viendo la tabla correcta en Supabase
- ✅ Refresca la página de Table Editor
- ✅ Verifica que no haya filtros activos

## 📞 Siguiente Paso

**Ejecuta el diagnóstico ahora:**
```
http://localhost:5173/supabase-diagnostic.html
```

El diagnóstico te dirá exactamente qué está mal y cómo solucionarlo.
