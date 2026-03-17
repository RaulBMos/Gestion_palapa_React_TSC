# Reestructura de Ingresos (Reserva + Finanzas)

Fecha: 2026-03-17

## Objetivo
Definir una arquitectura y flujo completo para manejar 3 tipos de ingresos en el sistema:
- Apartado (pre-pago parcial o total dentro de formulario de reserva)
- Confirmación (liquidación de saldo pendiente, vinculado a reserva existente)
- Otros ingresos (finanzas generales con categoría libre)

## Contexto
Actualmente:
- Las reservas guardan `totalAmount` en el contexto de espacio/horas.
- Transacciones de finanzas (`Transaction`) manejan `type`, `amount`, `category`, `description`, `reservationId?`.
- Cálculo financiero se apoya en transacciones históricas y hubo cambios en `calculateMonthlyFinancialBalance`.

Requerimiento nuevo:
- Ingreso de apartado se genera al crear/editar reserva.
- Ingreso de confirmación se registra en finanzas con `reservationId` de la reserva original.
- Otros ingresos se registran en finanzas independiente de reserva.

## 1) Modelos de datos (DB + Tipos TS)

### `Reservation`
- mantiene campos actuales.
- nuevo campo opcional:
  - `depositAmount?: number` (importe entregado al hacer apartado)
  - `depositPaymentMethod?: PaymentMethod` (opcional)
  - `paymentStatus?: 'apartado' | 'pendiente' | 'pagado'` o similar

### `Transaction` (en finanzas)
- `reservationId?: string` (ya existe, se usa para confirmaciones)
- `sourceType?: 'apartado' | 'confirmacion' | 'otro'`
- `isSettlement?: boolean` (opcional, si salda saldo de reserva)

## 2) Flujo de reserva + finanzas

### 2.1 Al crear/editar reserva (componente `Reservations`)
- Formulario debe permitir:
  - `tipoCobro`: `apartado` / `pago_total`.
  - `depositAmount` o `totalAmount` dependiendo de la opción.
- Si `tipoCobro === apartado`:
  - guarda reserva con `totalAmount` (costo total)
  - guarda `depositAmount` y `securityStatus='apartado'`
  - crea transacción en `Financials`:
    - `type = INCOME`
    - `amount = depositAmount`
    - `category = 'Apartado'` o elegible
    - `description = 'Apartado reserva #id'
    - `reservationId = id` 
    - `sourceType = 'apartado'`

- Si `tipoCobro === pago_total`:
  - guarda reserva con `totalAmount` y estado `pagado`
  - crea transacción similar con `amount = totalAmount` y `sourceType = 'apartado'` o `check`.

### 2.2 En módulo Finanzas (`Finances`) para confirmación
- Form registra transacción de tipo `INCOME` con `reservationId` ligado.
- En la UI, cuando se selecciona `vincular reserva`, buscar reservas con `paymentStatus !== pagado`.
- Al guardar confirmación:
  - crea transacción con `sourceType = 'confirmacion'`, `reservationId`.
  - actualiza reserva: verifica si suma `depositAmount + confirmAmount >= totalAmount` para marcar pagado.

### 2.3 Otros ingresos
- Mismo flujo actual de finanzas, `sourceType = 'otro'` y sin `reservationId`.

## 3) Cálculo de balances y KPI

- `calculateFinancialBalance` y `calculateMonthlyFinancialBalance` deberían recibir transacciones con `sourceType` y sumar por `type`.
- Adicional:
  - Show KPI: “Ingresos por apartados”, “Ingresos por confirmaciones”, “Otros ingresos”.
- Filtrar por fecha transaction.date.

## 4) Cambios en contextos / hooks

### `FinancialsContext`:
- agosto mantiene `data` y `allData`.
- al crear reserva con apartado, también refrescar `data` y `allData`.

### `ReservationsContext`:
- al guardar reserva, no crear transacción de ingresos aquí (dejamos en finanzas o con helper señalado).
- pero sí se puede usar un helper adicional `recordReservaIncome` cuando haya apartado.

### `useDashboardLogic`:
- usar `allTransactions` con `sourceType` para métricas ampliadas.

## 5) Migración y pruebas unitarias

- tests para reservar `apartado` y luego confirmar: `totalAmount` coincide, `transaction` creada dos veces,
- tests para préstamo total (one-step): `reservation.totalAmount` vs transacción.
- test para `sourceType` en `calculateMonthlyFinancialBalance`.

## 6) Consideraciones de UX

### Formulario de reserva
- `Pago` (alternativa):
  - `Monto de apartado`: número
  - `Modo cobro`: `Efectivo/Transferencia` (mantener `PaymentMethod`)
  - `Tipo pago`: `Apartado` + `Pago completo`.
- `Total de reserva` siempre visible.
- `A pagar restante` = total - apartado.

### Finanza confirmación
- filtro por reservas “pendientes”
- selección de reserva -> precarga `pendiente` o `monto total` (para validación)

## 7) CSV/Reporte y Back-end

- API supabase: reservar tabla `transactions` con campo `source_type`
- `reservations` tabla añade campos `deposit_amount`, `payment_status`.

## Preguntas de validación
1. Para “apartado” y “pago total” en reserva: ¿debe crearse siempre una transacción en finanzas (sí/no)?
2. ¿Falta estado de reserva `CONFIRMED` vs `COMPLETED` respecto al pago? (ej. `status` se mantiene igual).
3. ¿Confirmación parcial en finanzas es posible (por ejemplo 2 pagos de confirmación) o siempre 1 pago?
4. En caso de que haya cobro de “apartado” pero reserva se cancele, ¿debe generarse reversa en finanzas?

## Recomendación inmediata (next-step)
- Crear issue/ticket con este md.
- Validar con Product owner/PM las operaciones de caja y autorización de admin.
- Implementar en 2 fases: 1) esquema de datos + modelos; 2) lógica de reservas + transacciones.

## Estado de implementación (2026-03-17)
- Tipos actualizados en `src/types/index.ts`: `Reservation` con `depositAmount`, `outstandingAmount`, `paymentType`, `paymentStatus`; `Transaction` con `sourceType`.
- `Reservations`: formulario con `paymentType` (`apartado` / `pago_total`), `depositAmount`, cálculo `outstandingAmount`, `paymentStatus`, creación de transacción de ingreso (vinculada a reserva y con `sourceType.apartado`).
- `Finances`: selección opcional de `reservationId` para confirmación, transacción `sourceType='confirmacion'`, actualiza `outstandingAmount` y `paymentStatus` de reserva.
- `Dashboard`: usa transacciones completas con `sourceType` en `calculateMonthlyFinancialBalance` y `calculateFinancialBalance`.
- Tests: suite ejecutada `npm test -- --run` sin errores.
- Reglas de negocio aplicadas: pago total deja `outstandingAmount=0`, confirmación parcial permitida, cancelación no reversa de dinero.

## Confirmaciones solicitadas
- Se confirma que:
  - siempre se distingue `apartado` vs `pago_total`.
  - monto total pactado se captura en reserva y se calcula pendiente.
  - confirmación puede ser parcial o total (flexible).
  - cancelación no devuelve dinero; nueva fecha opcional.
  - validaciones pertinentes ya implementadas.

## Pendiente adicional (UI / formulario de reservas)
- Reestructurar formulario de reservas en versión escritorio para mejorar usabilidad y uso de pantallas anchas:
  - dividir en secciones en columnas (datos de cliente, fechas, habitacion/cabana, pagos y costos) en lugar de scroll infinito.
  - mantener la visualización actual (single-column) en móvil.
- Ejecución de este ajuste queda pendiente tras completarse la reestructura de finanzas.

