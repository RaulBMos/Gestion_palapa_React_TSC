# 🗄️ Arquitectura de Base de Datos - Supabase

## 📐 Diagrama de Relaciones

```
┌─────────────────┐
│     clients     │
│─────────────────│
│ id (PK)         │◄─────┐
│ name            │      │
│ email (unique)  │      │
│ phone           │      │
│ notes           │      │
│ user_id (FK)    │      │
└─────────────────┘      │
                         │
                         │ client_id (FK)
                         │
                    ┌────┴────────────┐
                    │  reservations   │
                    │─────────────────│
                    │ id (PK)         │◄─────┐
                    │ client_id (FK)  │      │
                    │ cabin_count     │      │
                    │ start_date      │      │
                    │ end_date        │      │
                    │ adults          │      │
                    │ children        │      │
                    │ total_amount    │      │
                    │ status          │      │
                    │ is_archived     │      │
                    │ user_id (FK)    │      │
                    └─────────────────┘      │
                                             │ reservation_id (FK)
                                             │
                                        ┌────┴──────────┐
                                        │ transactions  │
                                        │───────────────│
                                        │ id (PK)       │
                                        │ date          │
                                        │ amount        │
                                        │ type          │
                                        │ category      │
                                        │ description   │
                                        │ payment_method│
                                        │ reservation_id│
                                        │ user_id (FK)  │
                                        └───────────────┘

┌─────────────────┐
│ system_config   │
│─────────────────│
│ id (PK)         │
│ key (unique)    │
│ value (JSONB)   │
│ description     │
│ user_id (FK)    │
└─────────────────┘
```

---

## 🏗️ Estructura de Tablas

### `clients` - Clientes

Almacena información de los clientes.

| Columna       | Tipo        | Restricciones           | Descripción                        |
|---------------|-------------|-------------------------|------------------------------------|
| `id`          | UUID        | PK, DEFAULT uuid_v4()   | Identificador único                |
| `name`        | TEXT        | NOT NULL, length >= 2   | Nombre del cliente                 |
| `email`       | TEXT        | NOT NULL, UNIQUE, valid | Email (único)                      |
| `phone`       | TEXT        | NOT NULL, length >= 10  | Teléfono                           |
| `notes`       | TEXT        | NULLABLE                | Notas adicionales                  |
| `created_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Fecha de creación                  |
| `updated_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Última actualización (auto-update) |
| `deleted_at`  | TIMESTAMPTZ | NULLABLE                | Soft delete timestamp              |
| `user_id`     | UUID        | FK → auth.users         | Propietario del registro           |
| `search_vector`| tsvector   | GENERATED, GIN index    | Búsqueda full-text                |

**Índices**:
- `idx_clients_user_id`: Búsqueda por usuario
- `idx_clients_email`: Búsqueda por email
- `idx_clients_search`: Full-text search (nombre, email, teléfono)
- `idx_clients_deleted`: Filtrar eliminados

---

### `reservations` - Reservaciones

Almacena las reservaciones de cabañas.

| Columna       | Tipo        | Restricciones                      | Descripción                    |
|---------------|-------------|------------------------------------|--------------------------------|
| `id`          | UUID        | PK, DEFAULT uuid_v4()              | Identificador único            |
| `client_id`   | UUID        | FK → clients(id), ON DELETE RESTRICT | Cliente asociado             |
| `cabin_count` | INTEGER     | > 0 AND <= 20                      | Número de cabañas reservadas   |
| `start_date`  | DATE        | NOT NULL                           | Fecha inicio (check-in)        |
| `end_date`    | DATE        | NOT NULL, > start_date             | Fecha fin (check-out)          |
| `adults`      | INTEGER     | >= 0                               | Adultos y niños > 5 años       |
| `children`    | INTEGER     | >= 0                               | Niños < 5 años                 |
| `total_amount`| NUMERIC(10,2) | >= 0                             | Monto total                    |
| `status`      | TEXT        | ENUM (4 valores)                   | Estado de la reservación       |
| `is_archived` | BOOLEAN     | DEFAULT FALSE                      | Archivado (no cancelado)       |
| `notes`       | TEXT        | NULLABLE                           | Notas adicionales              |
| `created_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()            | Fecha de creación              |
| `updated_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()            | Última actualización           |
| `deleted_at`  | TIMESTAMPTZ | NULLABLE                           | Soft delete                    |
| `user_id`     | UUID        | FK → auth.users                    | Propietario                    |

**Estados (`status`)**:
- `Información`: Pendiente de confirmación
- `Confirmada`: Confirmada y pagada
- `Completada`: Check-out realizado
- `Cancelada`: Cancelada

**Índices**:
- `idx_reservations_client_id`: Búsqueda por cliente
- `idx_reservations_user_id`: Búsqueda por usuario
- `idx_reservations_dates`: Rango de fechas (para disponibilidad)
- `idx_reservations_status`: Filtrar por estado
- `idx_reservations_archived`: Filtrar archivados

**Constraints**:
- `valid_date_range`: end_date debe ser mayor que start_date
- `valid_guest_count`: Debe haber al menos 1 huésped (adulto o niño)

---

### `transactions` - Transacciones Financieras

Almacena ingresos y gastos.

| Columna          | Tipo        | Restricciones           | Descripción                    |
|------------------|-------------|-------------------------|--------------------------------|
| `id`             | UUID        | PK, DEFAULT uuid_v4()   | Identificador único            |
| `date`           | DATE        | NOT NULL, DEFAULT TODAY | Fecha de la transacción        |
| `amount`         | NUMERIC(10,2) | > 0                   | Monto (siempre positivo)       |
| `type`           | TEXT        | ENUM ('Ingreso', 'Gasto') | Tipo de transacción          |
| `category`       | TEXT        | NOT NULL, length >= 2   | Categoría                      |
| `description`    | TEXT        | NOT NULL                | Descripción                    |
| `payment_method` | TEXT        | ENUM (2 valores)        | Método de pago                 |
| `reservation_id` | UUID        | FK → reservations, NULLABLE, ON DELETE SET NULL | Reservación asociada |
| `created_at`     | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Fecha de creación              |
| `updated_at`     | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Última actualización           |
| `deleted_at`     | TIMESTAMPTZ | NULLABLE                | Soft delete                    |
| `user_id`        | UUID        | FK → auth.users         | Propietario                    |

**Métodos de Pago (`payment_method`)**:
- `Efectivo`
- `Transferencia`

**Índices**:
- `idx_transactions_user_id`: Búsqueda por usuario
- `idx_transactions_date`: Ordenar por fecha (DESC)
- `idx_transactions_type`: Filtrar ingresos/gastos
- `idx_transactions_reservation`: Transacciones de una reservación

---

### `system_config` - Configuración del Sistema

Almacena configuraciones globales (ej: número total de cabañas).

| Columna      | Tipo        | Restricciones       | Descripción                |
|--------------|-------------|---------------------|----------------------------|
| `id`         | UUID        | PK, DEFAULT uuid_v4() | Identificador único      |
| `key`        | TEXT        | NOT NULL, UNIQUE    | Clave de configuración     |
| `value`      | JSONB       | NOT NULL            | Valor (flexible)           |
| `description`| TEXT        | NULLABLE            | Descripción legible        |
| `user_id`    | UUID        | FK → auth.users     | Propietario                |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Fecha de creación      |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Última actualización   |

**Ejemplo de uso**:
```sql
INSERT INTO system_config (key, value, description, user_id)
VALUES ('total_cabins', '5', 'Total number of available cabins', auth.uid());
```

---

## 🔐 Row Level Security (RLS)

Todas las tablas tienen **RLS habilitado** para proteger los datos por usuario.

### Políticas Aplicadas

Cada tabla tiene 4 políticas estándar (excepto `system_config` con 3):

1. **SELECT** - Ver solo datos propios
   ```sql
   auth.uid() = user_id AND deleted_at IS NULL
   ```

2. **INSERT** - Crear solo con tu user_id
   ```sql
   auth.uid() = user_id
   ```

3. **UPDATE** - Actualizar solo tus propios datos
   ```sql
   auth.uid() = user_id
   ```

4. **DELETE** - Eliminar solo tus propios datos (soft delete)
   ```sql
   auth.uid() = user_id
   ```

**Ventajas**:
- ✅ Aislamiento de datos automático
- ✅ No necesitas filtrar por `user_id` en queries
- ✅ Protección a nivel de base de datos
- ✅ Anon key segura en el frontend

---

## 🧮 Funciones de Negocio (Stored Procedures)

### `check_cabin_availability`

Verifica disponibilidad de cabañas en un rango de fechas.

**Parámetros**:
```sql
p_start_date DATE,
p_end_date DATE,
p_cabin_count INTEGER,
p_total_cabins INTEGER,
p_exclude_reservation_id UUID (opcional)
```

**Retorna**: Tabla con fechas que NO tienen disponibilidad

**Ejemplo**:
```typescript
const { data, error } = await supabase.rpc('check_cabin_availability', {
  p_start_date: '2026-02-01',
  p_end_date: '2026-02-10',
  p_cabin_count: 2,
  p_total_cabins: 5,
});

// data = [
//   { date: '2026-02-05', available_cabins: 1, occupied_cabins: 4 },
//   // Solo retorna fechas SIN disponibilidad
// ]
```

---

### `get_financial_summary`

Calcula resumen financiero en un período.

**Parámetros**:
```sql
p_user_id UUID,
p_start_date DATE (opcional),
p_end_date DATE (opcional)
```

**Retorna**:
```typescript
{
  total_income: number,
  total_expenses: number,
  net_profit: number,
  profit_margin: number,
  transaction_count: number
}
```

**Ejemplo**:
```typescript
const { data } = await supabase.rpc('get_financial_summary', {
  p_user_id: userId,
  p_start_date: '2026-01-01',
  p_end_date: '2026-01-31',
});

console.log(data);
// {
//   total_income: 50000,
//   total_expenses: 12000,
//   net_profit: 38000,
//   profit_margin: 76.0,
//   transaction_count: 45
// }
```

---

### `get_occupancy_stats`

Calcula estadísticas de ocupación (KPIs de hospitalidad).

**Parámetros**:
```sql
p_user_id UUID,
p_start_date DATE,
p_end_date DATE,
p_total_cabins INTEGER
```

**Retorna**:
```typescript
{
  total_nights: number,        // Total de noches disponibles
  occupied_nights: number,     // Noches ocupadas
  occupancy_rate: number,      // % de ocupación
  total_revenue: number,       // Ingresos totales
  adr: number,                 // Average Daily Rate
  revpar: number               // Revenue Per Available Room
}
```

**Ejemplo**:
```typescript
const { data } = await supabase.rpc('get_occupancy_stats', {
  p_user_id: userId,
  p_start_date: '2026-01-01',
  p_end_date: '2026-01-31',
  p_total_cabins: 5,
});

// data = {
//   total_nights: 155,      // 5 cabañas × 31 días
//   occupied_nights: 93,
//   occupancy_rate: 60.0,   // 60% ocupación
//   total_revenue: 46500,
//   adr: 500,               // $500 por noche
//   revpar: 300             // $300 por cabaña disponible
// }
```

---

## 📊 Vistas (Views)

### `v_active_reservations`

Reservaciones activas con información del cliente.

**Columnas adicionales**:
- `client_name`, `client_email`, `client_phone`
- `nights`: Duración de la estadía
- `daily_rate`: Tarifa diaria promedio

**Uso**:
```typescript
const { data } = await supabase
  .from('v_active_reservations')
  .select('*')
  .order('start_date', { ascending: true });
```

---

### `v_transactions_detailed`

Transacciones con detalles de reservación asociada.

**Columnas adicionales**:
- `client_id`, `client_name`
- `reservation_start`, `reservation_end`

**Uso**:
```typescript
const { data } = await supabase
  .from('v_transactions_detailed')
  .select('*')
  .eq('type', 'Ingreso')
  .order('date', { ascending: false });
```

---

## 🔄 Triggers Automáticos

### `update_updated_at_column()`

Actualiza automáticamente `updated_at` en cada UPDATE.

**Aplicado a**:
- `clients`
- `reservations`
- `transactions`
- `system_config`

**Beneficio**: No necesitas setear `updated_at` manualmente.

---

## 🗑️ Soft Deletes

Todas las tablas implementan **soft delete** via `deleted_at`.

**Ventajas**:
- Historial completo
- Recuperación de datos
- Integridad referencial

**Índices optimizados** para filtrar `WHERE deleted_at IS NULL`.

---

## 🔍 Full-Text Search

La tabla `clients` tiene búsqueda full-text en español.

**Campos indexados**:
- `name`
- `email`
- `phone`

**Ejemplo**:
```typescript
const { data } = await supabase
  .from('clients')
  .select('*')
  .textSearch('search_vector', 'juan garcia', {
    config: 'spanish',
  });
```

---

## 📈 Optimizaciones de Performance

1. **Índices estratégicos** en columnas frecuentemente consultadas
2. **Partial indexes** para excluir soft-deleted rows
3. **Foreign keys** con ON DELETE policies (RESTRICT, SET NULL, CASCADE)
4. **Generated columns** (search_vector)
5. **TIMESTAMPTZ** para manejo correcto de zonas horarias

---

## 🔗 Integridad Referencial

### Restricciones de Eliminación

| Tabla         | Relación            | ON DELETE     | Razón                                      |
|---------------|---------------------|---------------|--------------------------------------------|
| `reservations`| → `clients`         | **RESTRICT**  | No borrar cliente con reservaciones       |
| `transactions`| → `reservations`    | **SET NULL**  | Transacción sobrevive a borrado de reserva|
| Todas         | → `auth.users`      | **CASCADE**   | Borrar todo al eliminar usuario           |

---

## 🛠️ Mantenimiento

### Consultas Útiles

```sql
-- Ver tamaño de tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Contar registros eliminados (soft delete)
SELECT 
  'clients' AS table_name,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted
FROM clients
UNION ALL
SELECT 'reservations', 
  COUNT(*) FILTER (WHERE deleted_at IS NULL),
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
FROM reservations;

-- Verificar integridad de FKs
SELECT * FROM reservations r
LEFT JOIN clients c ON r.client_id = c.id
WHERE c.id IS NULL AND r.deleted_at IS NULL;
```

---

## 📦 Backups Automáticos

Supabase (Plan Free) incluye:
- ✅ Backups diarios (últimos 7 días)
- ✅ Point-in-time recovery (planes pagos)
- ✅ Exportación manual en SQL Editor

**Recomendación**: Haz backups manuales periódicos.

---

## 🚀 Próximas Mejoras

1. **Audit Log**: Historial completo de cambios (comentado en schema.sql)
2. **Realtime subscriptions**: Notificaciones de cambios en tiempo real
3. **Database webhooks**: Integración con servicios externos
4. **Materialized views**: Para consultas complejas frecuentes
5. **Partitioning**: Si las transacciones crecen mucho

---

Para más detalles, revisa `supabase/schema.sql` 📄
