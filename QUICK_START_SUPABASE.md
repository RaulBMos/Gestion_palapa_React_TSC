# ⚡ Supabase - Guía Rápida de 5 Minutos

## 🎯 Objetivo
Conectar tu aplicación a Supabase en menos de 5 minutos.

---

## 📋 Pre-requisitos
- [ ] Node.js instalado
- [ ] Cuenta en [Supabase](https://app.supabase.com) (gratis)
- [ ] 5 minutos de tiempo

---

## 🚀 Pasos Rápidos

### 1. Crear Proyecto en Supabase (2 min)
```
1. Ir a: https://app.supabase.com
2. Clic en "New Project"
3. Nombre: "casagestion-pwa"
4. Database Password: (guarda esta contraseña)
5. Region: South America (São Paulo)
6. "Create new project"
7. ⏰ Esperar ~2 minutos
```

### 2. Crear Base de Datos (1 min)
```
1. En Supabase, ir a "SQL Editor"
2. Clic en "+ New query"
3. Copiar TODO el archivo: supabase/schema.sql
4. Pegar en el editor
5. Clic en "Run" (Ctrl+Enter)
6. ✅ Ver: "Success. No rows returned"
```

### 3. Configurar Variables (1 min)
```
1. En Supabase: Settings → API
2. Copiar:
   - Project URL
   - anon/public key

3. Editar: .env.local
   VITE_SUPABASE_URL=tu_url_aqui
   VITE_SUPABASE_ANON_KEY=tu_key_aqui
   VITE_USE_SUPABASE=true

4. Guardar archivo
```

### 4. Crear Usuario (30 seg)
```
1. En Supabase: Authentication → Users
2. "Add user" → "Create new user"
3. Email: tu-email@ejemplo.com
4. Password: (mínimo 6 caracteres)
5. ✅ "Auto Confirm User"
6. "Create user"
```

### 5. Reiniciar Servidor (30 seg)
```bash
# En la terminal
npm run dev
```

---

## ✅ Verificación Rápida

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Check 1: Configuración
import { USE_SUPABASE } from '@/config/supabase';
console.log('Supabase habilitado:', USE_SUPABASE); // debe ser true

// Check 2: Conexión
import { healthCheck } from '@/config/supabase';
const healthy = await healthCheck();
console.log('Conexión OK:', healthy); // debe ser true

// Check 3: Leer datos
import { getSupabaseClient } from '@/config/supabase';
const supabase = getSupabaseClient();
const { data, error } = await supabase.from('clients').select('count');
console.log('Base de datos funcional:', !error); // debe ser true
```

**Si todos son `true`**: ✅ ¡Listo! Supabase está funcionando.

---

## 🔧 Si algo falla

### Error: "Supabase is disabled"
```bash
# Verificar .env.local
VITE_USE_SUPABASE=true  # ← debe ser "true"

# Reiniciar servidor
npm run dev
```

### Error: "Failed to fetch clients"
```
Causa: No estás autenticado o RLS bloqueando

Solución:
1. Crear usuario en: Authentication → Users
2. Verificar que email esté confirmado
3. Re-ejecutar schema.sql (RLS policies)
```

### Error: "Invalid API Key"
```
Causa: API key incorrecta

Solución:
1. Ir a: Settings → API
2. Copiar la "anon key" (NO la service_role key)
3. Pegar en .env.local
4. Reiniciar servidor
```

### Health Check falla
```
Causa: URL incorrecta o typo

Solución:
1. Verificar VITE_SUPABASE_URL en .env.local
2. Debe tener formato: https://xxxxx.supabase.co
3. Sin "/" al final
```

---

## 📦 Migrar Datos (Opcional)

Si tienes datos en localStorage:

```typescript
// 1. Crear backup (en la consola del navegador)
import { backupLocalStorage } from '@/services/storageAdapter';
const backup = backupLocalStorage();
console.log(backup);

// 2. Descargar backup
const dataStr = JSON.stringify(backup, null, 2);
const blob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `backup-${backup.timestamp}.json`;
link.click();

// 3. Migrar
import { migrateLocalStorageToSupabase } from '@/services/storageAdapter';
const result = await migrateLocalStorageToSupabase();
console.log(result);
```

---

## 🎨 Usar el Panel Visual (Más Fácil)

En tu aplicación, importa el componente:

```typescript
import { SupabaseMigrationPanel } from '@/components/organisms/SupabaseMigrationPanel';

// Agregar en cualquier vista (ej: Settings)
<SupabaseMigrationPanel />
```

Esto te da una UI para:
- ✅ Verificar conexión
- ✅ Crear backup
- ✅ Migrar datos
- ✅ Ver errores

---

## 📚 Documentación Completa

Para detalles técnicos completos:
- **Setup completo**: `SUPABASE_SETUP.md`
- **Arquitectura**: `supabase/README.md`
- **Resumen**: `SUPABASE_INTEGRATION.md`
- **Schema SQL**: `supabase/schema.sql`

---

## ✨ ¡Listo!

Tu aplicación ahora usa Supabase como backend 🎉

**Próximo paso**: Implementar autenticación (login/signup)

---

**Tiempo total**: ~5 minutos ⚡
