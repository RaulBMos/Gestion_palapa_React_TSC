# 🚀 Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase como backend para tu aplicación CasaGestión PWA.

## 📋 Tabla de Contenidos

- [Paso 1: Crear Proyecto en Supabase](#paso-1-crear-proyecto-en-supabase)
- [Paso 2: Crear la Base de Datos](#paso-2-crear-la-base-de-datos)
- [Paso 3: Configurar Variables de Entorno](#paso-3-configurar-variables-de-entorno)
- [Paso 4: Configuración de Autenticación](#paso-4-configuración-de-autenticación)
- [Paso 5: Migrar Datos desde localStorage](#paso-5-migrar-datos-desde-localstorage)
- [Paso 6: Activar Supabase](#paso-6-activar-supabase)
- [Troubleshooting](#troubleshooting)

---

## Paso 1: Crear Proyecto en Supabase

1. **Crear Cuenta**
   - Ve a [https://app.supabase.com](https://app.supabase.com)
   - Regístrate o inicia sesión con GitHub

2. **Crear Nuevo Proyecto**
   - Haz clic en "New Project"
   - Nombre del proyecto: `casagestion-pwa` (o el nombre que prefieras)
   - Database Password: **Guarda esta contraseña en un lugar seguro**
   - Región: Selecciona la más cercana (e.g., `South America (São Paulo)`)
   - Plan: Comienza con **Free** (2 proyectos gratis)

3. **Esperar Inicialización**
   - Tarda aproximadamente 2 minutos
   - Verás una barra de progreso

---

## Paso 2: Crear la Base de Datos

### Opción A: SQL Editor (Recomendado)

1. En el sidebar de Supabase, ve a **SQL Editor**
2. Haz clic en "+ New query"
3. Copia y pega **TODO** el contenido del archivo:
   ```
   supabase/schema.sql
   ```
4. Haz clic en "Run" (o presiona `Ctrl+Enter`)
5. Deberías ver: **"Success. No rows returned"**

### Opción B: Supabase CLI (Avanzado)

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Conectar a tu proyecto
supabase link --project-ref your-project-ref

# Ejecutar migración
supabase db push
```

### Verificar Creación de Tablas

1. Ve a **Table Editor** en el sidebar
2. Deberías ver 4 tablas:
   - ✅ `clients`
   - ✅ `reservations`
   - ✅ `transactions`
   - ✅ `system_config`

---

## Paso 3: Configurar Variables de Entorno

### Obtener Credenciales

1. En Supabase, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://abcdefgh.supabase.co`)
   - **anon/public key** (empieza con `eyJhbGc...`)

### Configurar `.env.local`

Abre el archivo `.env.local` en la raíz del proyecto y reemplaza:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...tu_anon_key_aqui
```

**⚠️ IMPORTANTE**: 
- NO compartas estas credenciales públicamente
- NO las subas a GitHub (ya están en `.gitignore`)
- La `anon key` es segura para el frontend (RLS protege los datos)

---

## Paso 4: Configuración de Autenticación

### Habilitar Autenticación por Email

1. Ve a **Authentication** → **Providers**
2. Habilita **Email** (viene activado por defecto)
3. **Opcional**: Configura otros proveedores (Google, GitHub, etc.)

### Crear Tu Primer Usuario

#### Opción 1: Desde Supabase Dashboard

1. Ve a **Authentication** → **Users**
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa:
   - Email: `tu-email@ejemplo.com`
   - Password: (mínimo 6 caracteres)
   - Auto Confirm User: ✅ (marcar)
4. Haz clic en **"Create user"**

#### Opción 2: Implementar Sign Up en la App (Próximo paso)

```typescript
// Ejemplo de código para implementar después
import { supabase } from '@/config/supabase';

async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  // ...
}
```

### Configurar RLS (Row Level Security)

El script SQL ya configuró las políticas de seguridad, pero verifica:

1. Ve a **Authentication** → **Policies**
2. Deberías ver políticas para:
   - `clients` (4 políticas)
   - `reservations` (4 políticas)
   - `transactions` (4 políticas)
   - `system_config` (3 políticas)

---

## Paso 5: Migrar Datos desde localStorage

### 1. Hacer Backup de Datos Actuales

**⚠️ CRÍTICO**: Antes de migrar, crea un backup.

```typescript
// En la consola del navegador (DevTools)
import { backupLocalStorage } from '@/services/storageAdapter';

const backup = backupLocalStorage();
console.log('Backup creado:', backup);

// Guardar como archivo JSON
const dataStr = JSON.stringify(backup, null, 2);
const blob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `casagestion-backup-${backup.timestamp}.json`;
link.click();
```

### 2. Ejecutar Migración

Una vez que estés **autenticado en la app**, ejecuta:

```typescript
// En la consola del navegador
import { migrateLocalStorageToSupabase } from '@/services/storageAdapter';

const result = await migrateLocalStorageToSupabase();
console.log('Resultado de migración:', result);

// Deberías ver algo como:
// {
//   success: true,
//   migrated: {
//     clients: 15,
//     reservations: 42,
//     transactions: 128
//   },
//   errors: []
// }
```

### 3. Verificar Datos Migrados

1. En Supabase, ve a **Table Editor**
2. Revisa cada tabla y verifica que los datos estén presentes
3. Compara con tu backup

---

## Paso 6: Activar Supabase

Una vez que **todo esté configurado y los datos migrados**:

1. Edita `.env.local`:

```bash
# Feature Flags
VITE_USE_SUPABASE=true  # ← Cambiar a true
```

2. **Reinicia el servidor de desarrollo**:

```bash
npm run dev
```

3. **Verifica que funcione**:
   - Los datos deberían cargarse desde Supabase
   - Cualquier cambio se guardará en la nube
   - El localStorage quedará como fallback

---

## 🧪 Fase de Prueba (Recomendado)

### Probar con Supabase sin Migración

Si quieres probar Supabase SIN migrar tus datos reales:

1. Crea datos de prueba manualmente en Supabase (Table Editor)
2. Activa `VITE_USE_SUPABASE=true`
3. Tu localStorage original permanecerá intacto
4. Desactiva cuando termines de probar

### Dual Mode (localStorage + Supabase)

Si quieres mantener ambos sistemas temporalmente:

```typescript
// En storageAdapter.ts puedes modificar para sincronizar:
async addClient(client: Omit<Client, 'id'>): Promise<Client> {
  // Guardar en ambos
  const supabaseClient = await SupabaseService.createClient(client);
  
  const localClient: Client = { ...client, id: supabaseClient.id };
  const clients = getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS);
  clients.push(localClient);
  saveToLocalStorage(STORAGE_KEYS.CLIENTS, clients);
  
  return supabaseClient;
}
```

---

## 🔧 Troubleshooting

### Error: "VITE_SUPABASE_URL is not configured"

**Solución**: 
- Verifica que `.env.local` tenga las variables correctas
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Failed to fetch clients from Supabase"

**Causas posibles**:
1. **No estás autenticado**: Crea y autentica un usuario primero
2. **RLS bloqueando**: Verifica que las políticas estén activas
3. **URL/Key incorrectas**: Revisa las credenciales en `.env.local`

**Debugging**:
```typescript
import { healthCheck } from '@/config/supabase';
const isHealthy = await healthCheck();
console.log('Supabase health:', isHealthy);
```

### Error: "Row Level Security Error"

**Solución**:
- Asegúrate de estar autenticado
- Verifica en **Authentication** → **Users** que tu usuario existe
- Revisa que las políticas RLS estén activas (Paso 4)

### Los Datos no Aparecen Después de Migrar

**Solución**:
1. Ve a Supabase → **Table Editor**
2. Verifica manualmente que los datos estén ahí
3. Check que `user_id` coincida con tu usuario autenticado:
   ```sql
   -- En SQL Editor
   SELECT auth.uid(); -- Tu user_id actual
   SELECT user_id, name FROM clients LIMIT 5;
   ```

### Error: "Invalid API Key"

**Solución**:
- Verifica que copiaste la **anon/public key**, NO la service_role key
- La anon key es más larga (~300 caracteres)

### Migración Parcial (algunos items fallaron)

**Solución**:
```typescript
const result = await migrateLocalStorageToSupabase();
console.log('Errors:', result.errors);

// Ver detalles de cada error
result.errors.forEach((err, i) => {
  console.log(`Error ${i + 1}:`, err);
});
```

---

## 📊 Monitoreo y Métricas

### Ver Uso de la Base de Datos

1. Ve a **Settings** → **Usage**
2. Revisa:
   - Database size
   - API requests
   - Bandwidth

### Ver Logs en Tiempo Real

1. Ve a **Logs** → **Database**
2. Filtra por tabla o tipo de operación

---

## 🚀 Siguiente Paso: Implementar Autenticación

Actualmente, el sistema asume un usuario autenticado. Para producción:

1. Crea componentes de Login/Signup
2. Implementa `onAuthStateChange` en el DataProvider
3. Agrega protección de rutas

**Tutorial recomendado**: [Supabase Auth con React](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)

---

## 📚 Recursos Adicionales

- [Documentación Supabase](https://supabase.com/docs)
- [Guía de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript/introduction)
- [Postgres Functions](https://supabase.com/docs/guides/database/functions)

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Supabase
- [ ] Schema SQL ejecutado correctamente
- [ ] 4 tablas visibles en Table Editor
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Usuario creado y autenticado
- [ ] Políticas RLS verificadas
- [ ] Backup de localStorage creado
- [ ] Migración ejecutada exitosamente
- [ ] Datos verificados en Supabase
- [ ] `VITE_USE_SUPABASE=true` activado
- [ ] Aplicación funcionando correctamente

---

**¿Necesitas ayuda?** 
- Revisa los errores en la consola del navegador (DevTools → Console)
- Revisa los logs en Supabase (Logs → Database)
- Verifica el health check: `await healthCheck()`
