# 📊 Métricas KPI - CasaGestión PWA

## Índice
- [Introducción](#introducción)
- [Métricas de Ocupación](#métricas-de-ocupación)
- [Métricas de Ingresos](#métricas-de-ingresos)
- [Métricas Financieras](#métricas-financieras)
- [Métricas de Comportamiento](#métricas-de-comportamiento)
- [Interpretación y Uso](#interpretación-y-uso)
- [Ejemplos Prácticos](#ejemplos-prácticos)

---

## Introducción

Este documento describe las métricas clave de rendimiento (KPI) utilizadas en CasaGestión PWA para medir y optimizar el desempeño del negocio de alojamiento. Todas las métricas se calculan automáticamente en el Dashboard y se actualizan en tiempo real.

---

## Métricas de Ocupación

### 1. **Tasa de Ocupación (Occupancy Rate)**

**Definición:**  
Porcentaje de noches ocupadas respecto al total de noches disponibles en el período actual (mes).

**Fórmula:**
```
Ocupación (%) = (Noches Ocupadas / Noches Disponibles) × 100
```

**Cálculo en el Sistema:**
```typescript
// Noches Disponibles = Días del Mes × Total de Cabañas
const diasEnMes = 30;
const totalCabanas = 3;
const nochesDisponibles = diasEnMes × totalCabanas; // 90 noches

// Noches Ocupadas = Suma de (días de reserva × cabañas reservadas)
// Solo se cuentan reservas CONFIRMADAS y COMPLETADAS
const nochesOcupadas = reservations
  .filter(r => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
  .reduce((total, reserva) => {
    const dias = calcularDias(reserva.startDate, reserva.endDate);
    return total + (dias × reserva.cabinCount);
  }, 0);

const ocupacion = (nochesOcupadas / nochesDisponibles) × 100;
```

**Interpretación:**
- **0-40%**: Ocupación baja - Considerar estrategias de marketing o reducción de precios
- **40-70%**: Ocupación media - Rango saludable para la mayoría de negocios
- **70-90%**: Ocupación alta - Excelente rendimiento
- **90-100%**: Ocupación muy alta - Considerar aumentar precios o expandir capacidad

**Ejemplo:**
```
Mes: Enero (31 días)
Cabañas: 3
Noches disponibles: 31 × 3 = 93 noches

Reservas:
- Reserva 1: 5 días × 2 cabañas = 10 noches
- Reserva 2: 3 días × 1 cabaña = 3 noches
- Reserva 3: 7 días × 3 cabañas = 21 noches
Total ocupadas: 34 noches

Ocupación = (34 / 93) × 100 = 36.56%
```

---

## Métricas de Ingresos

### 2. **ADR (Average Daily Rate) - Tarifa Promedio Diaria**

**Definición:**  
Precio promedio cobrado por noche de alojamiento, calculado únicamente sobre las noches vendidas.

**Fórmula:**
```
ADR = Ingresos Totales por Alojamiento / Total de Noches Vendidas
```

**Cálculo en el Sistema:**
```typescript
const reservasConfirmadas = reservations.filter(
  r => r.status === 'CONFIRMED' || r.status === 'COMPLETED'
);

const ingresosTotal = reservasConfirmadas.reduce(
  (sum, r) => sum + r.totalAmount, 
  0
);

const nochesVendidas = reservasConfirmadas.reduce((sum, r) => {
  const dias = calcularDias(r.startDate, r.endDate);
  return sum + (dias × r.cabinCount);
}, 0);

const adr = nochesVendidas > 0 ? ingresosTotal / nochesVendidas : 0;
```

**Interpretación:**
- Indica el **valor percibido** de tu alojamiento
- Permite compararte con competidores
- Ayuda a ajustar precios según temporada
- Un ADR alto no garantiza buenos ingresos si la ocupación es baja

**Factores que afectan el ADR:**
- Temporada (alta/baja)
- Día de la semana (fin de semana vs entre semana)
- Eventos locales
- Calidad del servicio
- Competencia en la zona

**Ejemplo:**
```
Reservas confirmadas:
- Reserva 1: $6,000 por 4 noches × 1 cabaña = 4 noches vendidas
- Reserva 2: $9,000 por 3 noches × 2 cabañas = 6 noches vendidas
- Reserva 3: $5,000 por 5 noches × 1 cabaña = 5 noches vendidas

Ingresos totales: $20,000
Noches vendidas: 4 + 6 + 5 = 15 noches

ADR = $20,000 / 15 = $1,333.33 por noche
```

---

### 3. **RevPAR (Revenue Per Available Room) - Ingreso por Habitación Disponible**

**Definición:**  
La métrica **más importante** en la industria hotelera. Mide cuánto dinero genera cada cabaña/habitación disponible, independientemente de si está ocupada o vacía.

**Fórmula:**
```
RevPAR = (Tasa de Ocupación / 100) × ADR
```

O alternativamente:
```
RevPAR = Ingresos Totales / Total de Habitaciones Disponibles
```

**Cálculo en el Sistema:**
```typescript
const ocupacionRate = calculateMonthlyOccupancy(reservations, totalCabins);
const adr = calculateADR(reservations);

const revpar = (ocupacionRate / 100) × adr;
```

**Interpretación:**
- **RevPAR combina ocupación y precio** en una sola métrica
- Es el mejor indicador del **rendimiento general** del negocio
- Permite evaluar estrategias de pricing
- Facilita comparaciones entre períodos

**Estrategias según RevPAR:**

| Escenario | Ocupación | ADR | RevPAR | Acción Recomendada |
|-----------|-----------|-----|--------|-------------------|
| A | 90% | $1,000 | $900 | Aumentar precios gradualmente |
| B | 40% | $2,000 | $800 | Reducir precios para aumentar ocupación |
| C | 70% | $1,500 | $1,050 | Balance óptimo - mantener estrategia |
| D | 30% | $800 | $240 | Crisis - revisar marketing y precios |

**Ejemplo Comparativo:**
```
Estrategia 1 (Precio Alto):
- Ocupación: 40%
- ADR: $2,000
- RevPAR: 0.40 × $2,000 = $800

Estrategia 2 (Precio Moderado):
- Ocupación: 70%
- ADR: $1,200
- RevPAR: 0.70 × $1,200 = $840

✅ Estrategia 2 es mejor: Mayor RevPAR = Más ingresos totales
```

---

## Métricas Financieras

### 4. **Ingresos Totales (Total Income)**

**Definición:**  
Suma de todas las transacciones de tipo "Ingreso" en el período seleccionado.

**Cálculo en el Sistema:**
```typescript
const totalIncome = transactions
  .filter(t => t.type === 'INCOME')
  .reduce((sum, t) => sum + t.amount, 0);
```

**Categorías de Ingresos:**
- Alojamiento (reservas)
- Servicios adicionales
- Depósitos
- Otros ingresos

---

### 5. **Gastos Totales (Total Expenses)**

**Definición:**  
Suma de todas las transacciones de tipo "Gasto" en el período seleccionado.

**Cálculo en el Sistema:**
```typescript
const totalExpenses = transactions
  .filter(t => t.type === 'EXPENSE')
  .reduce((sum, t) => sum + t.amount, 0);
```

**Categorías de Gastos:**
- Mantenimiento
- Servicios (agua, luz, internet)
- Limpieza
- Suministros
- Marketing
- Otros gastos operativos

---

### 6. **Utilidad Neta (Net Profit)**

**Definición:**  
Diferencia entre ingresos y gastos. Indica la rentabilidad real del negocio.

**Fórmula:**
```
Utilidad Neta = Ingresos Totales - Gastos Totales
```

**Cálculo en el Sistema:**
```typescript
const netProfit = totalIncome - totalExpenses;
```

**Interpretación:**
- **Positivo**: El negocio es rentable
- **Negativo**: Pérdidas - Revisar estructura de costos
- **Cercano a cero**: Punto de equilibrio - Optimizar

---

### 7. **Margen de Utilidad (Profit Margin)**

**Definición:**  
Porcentaje de los ingresos que se convierte en ganancia después de cubrir todos los gastos.

**Fórmula:**
```
Margen de Utilidad (%) = (Utilidad Neta / Ingresos Totales) × 100
```

**Cálculo en el Sistema:**
```typescript
const profitMargin = totalIncome > 0 && netProfit > 0
  ? (netProfit / totalIncome) × 100
  : 0;
```

**Interpretación:**
- **< 10%**: Margen bajo - Revisar costos
- **10-20%**: Margen saludable para alojamiento
- **20-30%**: Margen excelente
- **> 30%**: Margen excepcional

**Ejemplo:**
```
Ingresos: $50,000
Gastos: $35,000
Utilidad Neta: $15,000

Margen = ($15,000 / $50,000) × 100 = 30%
```

---

## Métricas de Comportamiento

### 8. **Duración Promedio de Estancia (Average Stay Duration)**

**Definición:**  
Número promedio de noches que los huéspedes se quedan en el alojamiento.

**Fórmula:**
```
Duración Promedio = Suma de Noches de Todas las Reservas / Número de Reservas
```

**Cálculo en el Sistema:**
```typescript
const validReservations = reservations.filter(
  r => r.status === 'CONFIRMED' || r.status === 'COMPLETED'
);

const totalStayDuration = validReservations.reduce((sum, r) => {
  const dias = calcularDias(r.startDate, r.endDate);
  return sum + dias;
}, 0);

const avgStayDuration = validReservations.length > 0
  ? totalStayDuration / validReservations.length
  : 0;
```

**Interpretación:**
- **1-2 noches**: Estancias cortas (turismo de paso)
- **3-5 noches**: Estancias medias (vacaciones cortas)
- **6+ noches**: Estancias largas (vacaciones extendidas)

**Uso Estratégico:**
- Ofrecer descuentos por estancias largas
- Ajustar políticas de check-in/check-out
- Planificar servicios según duración típica

---

## Interpretación y Uso

### Dashboard de Métricas

El Dashboard muestra todas las métricas en tiempo real con las siguientes características:

1. **Actualización Automática**: Las métricas se recalculan cada vez que hay cambios en reservas o transacciones
2. **Período Actual**: Por defecto, todas las métricas se calculan para el mes en curso
3. **Formato Visual**: Números grandes formateados con separadores de miles y símbolos de moneda
4. **Indicadores de Tendencia**: (Futuro) Comparación con períodos anteriores

### Relación Entre Métricas

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Ocupación × ADR = RevPAR                      │
│                                                 │
│  ↓                                              │
│                                                 │
│  RevPAR × Noches Disponibles = Ingresos        │
│                                                 │
│  ↓                                              │
│                                                 │
│  Ingresos - Gastos = Utilidad Neta            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Toma de Decisiones

**Escenario 1: Ocupación Baja, ADR Alto**
```
Ocupación: 35%
ADR: $2,500
RevPAR: $875

Acción: Reducir precios un 20% para aumentar ocupación al 60%
Resultado esperado:
- Nuevo ADR: $2,000
- Nueva Ocupación: 60%
- Nuevo RevPAR: $1,200 (↑ 37%)
```

**Escenario 2: Ocupación Alta, ADR Bajo**
```
Ocupación: 85%
ADR: $1,000
RevPAR: $850

Acción: Aumentar precios un 15% (la demanda lo permite)
Resultado esperado:
- Nuevo ADR: $1,150
- Nueva Ocupación: 75% (ligera reducción aceptable)
- Nuevo RevPAR: $862.50 (↑ 1.5%)
```

**Escenario 3: Margen de Utilidad Bajo**
```
Ingresos: $100,000
Gastos: $92,000
Margen: 8%

Acciones:
1. Revisar gastos operativos (reducir 10% = $9,200 ahorrados)
2. Aumentar ADR un 5% (sin afectar ocupación)
3. Resultado: Margen sube a 15%
```

---

## Ejemplos Prácticos

### Ejemplo Completo: Mes de Enero

**Datos Base:**
- Cabañas disponibles: 3
- Días del mes: 31
- Noches disponibles: 93

**Reservas:**
```
1. Cliente A: 5 noches, 2 cabañas, $15,000
2. Cliente B: 3 noches, 1 cabaña, $4,500
3. Cliente C: 7 noches, 3 cabañas, $31,500
4. Cliente D: 2 noches, 1 cabaña, $3,000
```

**Transacciones:**
```
Ingresos:
- Alojamiento: $54,000 (de las reservas)
- Servicios adicionales: $6,000
Total Ingresos: $60,000

Gastos:
- Mantenimiento: $8,000
- Servicios: $5,000
- Limpieza: $7,000
- Suministros: $3,000
Total Gastos: $23,000
```

**Cálculo de Métricas:**

1. **Noches Ocupadas:**
   - Cliente A: 5 × 2 = 10 noches
   - Cliente B: 3 × 1 = 3 noches
   - Cliente C: 7 × 3 = 21 noches
   - Cliente D: 2 × 1 = 2 noches
   - **Total: 36 noches**

2. **Ocupación:**
   ```
   (36 / 93) × 100 = 38.71%
   ```

3. **ADR:**
   ```
   $54,000 / 36 = $1,500 por noche
   ```

4. **RevPAR:**
   ```
   (38.71 / 100) × $1,500 = $580.65
   ```
   O alternativamente:
   ```
   $54,000 / 93 = $580.65
   ```

5. **Utilidad Neta:**
   ```
   $60,000 - $23,000 = $37,000
   ```

6. **Margen de Utilidad:**
   ```
   ($37,000 / $60,000) × 100 = 61.67%
   ```

7. **Duración Promedio:**
   ```
   (5 + 3 + 7 + 2) / 4 = 4.25 noches
   ```

**Resumen del Mes:**
```
✅ Ocupación: 38.71% (Baja - Oportunidad de mejora)
✅ ADR: $1,500 (Precio competitivo)
⚠️ RevPAR: $580.65 (Mejorable aumentando ocupación)
✅ Utilidad Neta: $37,000 (Excelente)
✅ Margen: 61.67% (Excepcional)
✅ Estancia Promedio: 4.25 noches (Buena)

Recomendación: Implementar estrategia de marketing para
aumentar ocupación al 60% manteniendo el ADR actual.
```

---

## Notas Técnicas

### Exclusiones en Cálculos

Las siguientes reservas **NO** se incluyen en los cálculos:

1. **Estado CANCELLED**: Reservas canceladas
2. **Estado INFORMATION**: Consultas o cotizaciones
3. **Reservas archivadas**: Marcadas como `isArchived: true`

### Precisión de Cálculos

- Todos los montos se redondean a **2 decimales**
- Los porcentajes se redondean a **0 decimales** para visualización
- Los cálculos internos mantienen precisión completa

### Actualización de Datos

Las métricas se recalculan:
- Al cargar el Dashboard
- Al crear/editar/eliminar una reserva
- Al crear/editar/eliminar una transacción
- Al cambiar el período de visualización (futuro)

---

## Referencias

- **Implementación**: `src/utils/calculations.ts`
- **Hook de Dashboard**: `src/hooks/useDashboardLogic.ts`
- **Componente Visual**: `src/components/organisms/Dashboard.tsx`
- **Tests**: `src/utils/__tests__/calculations.test.ts`

---

**Última actualización**: 2026-02-07  
**Versión**: 1.0.0
