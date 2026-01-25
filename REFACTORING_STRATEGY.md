# Estrategia de Refactorización: Clean Architecture

Este documento describe cómo reestructurar el proyecto de **monolítico a escalable**.

---

## 📊 Estructura Propuesta

```
src/
├── components/                 # Presentación pura (Atomic Design)
│   ├── atoms/                 # Componentes base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   └── __tests__/
│   ├── molecules/             # Composición de atoms
│   │   ├── TransactionCard.tsx
│   │   ├── ClientCard.tsx
│   │   ├── ReservationRow.tsx
│   │   └── __tests__/
│   ├── organisms/             # Composición de molecules
│   │   ├── ReservationCalendar.tsx
│   │   ├── FinanceChart.tsx
│   │   ├── ClientList.tsx
│   │   └── __tests__/
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   └── ErrorBoundary.tsx
│
├── containers/                # Smart Components (lógica)
│   ├── DashboardContainer.tsx    # Smart wrapper del Dashboard
│   ├── ReservationContainer.tsx
│   ├── FinanceContainer.tsx
│   ├── ClientContainer.tsx
│   └── __tests__/
│
├── hooks/                      # Custom hooks reutilizables
│   ├── useSafeLocalStorage.ts
│   ├── useClientStorage.ts
│   ├── useReservationStorage.ts
│   ├── useTransactionStorage.ts
│   ├── useAiAnalysis.ts
│   └── __tests__/
│
├── contexts/                   # Estado compartido (Context API)
│   ├── ClientContext.tsx       # Contexto de clientes
│   ├── ReservationContext.tsx  # Contexto de reservas
│   ├── FinanceContext.tsx      # Contexto de finanzas
│   ├── NotificationContext.tsx # Contexto de notificaciones
│   └── __tests__/
│
├── services/                   # Lógica de negocio y API
│   ├── api/
│   │   ├── geminiService.ts
│   │   ├── clientService.ts
│   │   ├── reservationService.ts
│   │   └── transactionService.ts
│   ├── calculations/          # Lógica pura de cálculos
│   │   ├── kpiCalculator.ts
│   │   ├── occupancyCalculator.ts
│   │   ├── financialCalculator.ts
│   │   └── __tests__/
│   ├── validators/            # Validación de datos
│   │   ├── clientValidator.ts
│   │   ├── reservationValidator.ts
│   │   ├── transactionValidator.ts
│   │   └── __tests__/
│   └── __tests__/
│
├── utils/                      # Utilidades puras
│   ├── formatters/
│   │   ├── dateFormatter.ts
│   │   ├── currencyFormatter.ts
│   │   └── __tests__/
│   ├── converters/
│   │   ├── dateConverter.ts
│   │   └── __tests__/
│   ├── constants.ts
│   └── helpers.ts
│
├── types/                      # Tipos globales
│   ├── index.ts               # Exporta todo
│   ├── models.ts              # Interfaces de datos
│   ├── api.ts                 # Response/Request types
│   └── errors.ts              # Custom error types
│
├── pages/                      # Rutas principales
│   ├── DashboardPage.tsx
│   ├── ReservationPage.tsx
│   ├── FinancePage.tsx
│   ├── ClientPage.tsx
│   └── ErrorPage.tsx
│
├── test/                       # Test utilities
│   ├── setup.ts
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── data.ts
│   └── fixtures/
│
├── App.tsx                     # Raíz con providers
├── index.tsx                   # Render
└── main.tsx                    # Entry point Vite
```

---

## 🔄 Fases de Refactorización

### **Fase 1: Crear estructura base (No tocar lógica)**

**Duración**: 4-6 horas

1. Crear todas las carpetas
2. Mover componentes actuales a `components/organisms/`
3. Crear carpetas `hooks/`, `contexts/`, `services/`
4. Crear archivos vacíos para preparación

```bash
# Crear estructura
mkdir -p src/components/{atoms,molecules,organisms,layout}
mkdir -p src/containers
mkdir -p src/hooks
mkdir -p src/contexts
mkdir -p src/services/{api,calculations,validators}
mkdir -p src/utils/{formatters,converters}
mkdir -p src/pages
mkdir -p src/test/mocks

# Mover componentes
mv src/components/Dashboard.tsx src/components/organisms/
mv src/components/Reservations.tsx src/components/organisms/
mv src/components/Finances.tsx src/components/organisms/
mv src/components/Clients.tsx src/components/organisms/
mv src/components/Layout.tsx src/components/layout/
```

---

### **Fase 2: Extraer hooks de estado**

**Duración**: 8-10 horas

#### Crear `hooks/useClientStorage.ts`:

```typescript
// src/hooks/useClientStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { Client } from '../types';
import { useSafeLocalStorage } from './useSafeLocalStorage';

const isClientArray = (data: unknown): data is Client[] => {
  return (
    Array.isArray(data) &&
    data.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'name' in item &&
        'email' in item
    )
  );
};

/**
 * Hook para gestionar el almacenamiento de clientes
 * @returns Object con clientes, setter y utilidades
 */
export const useClientStorage = (initialClients: Client[]) => {
  const [clients, setClients, { loading, error }] = useSafeLocalStorage<Client[]>(
    'cg_clients',
    initialClients,
    { validator: isClientArray }
  );

  const addClient = useCallback(
    (client: Client) => {
      setClients([...clients, client]);
    },
    [clients, setClients]
  );

  const editClient = useCallback(
    (updatedClient: Client) => {
      setClients(
        clients.map(c => (c.id === updatedClient.id ? updatedClient : c))
      );
    },
    [clients, setClients]
  );

  const deleteClient = useCallback(
    (id: string) => {
      setClients(clients.filter(c => c.id !== id));
    },
    [clients, setClients]
  );

  const getClientById = useCallback(
    (id: string) => clients.find(c => c.id === id),
    [clients]
  );

  return {
    clients,
    setClients,
    addClient,
    editClient,
    deleteClient,
    getClientById,
    loading,
    error,
  };
};
```

#### Crear similar para `useReservationStorage.ts`:

```typescript
// src/hooks/useReservationStorage.ts
import { useState, useCallback } from 'react';
import { Reservation, ReservationStatus } from '../types';
import { useSafeLocalStorage } from './useSafeLocalStorage';

const isReservationArray = (data: unknown): data is Reservation[] => {
  return (
    Array.isArray(data) &&
    data.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'clientId' in item &&
        'startDate' in item &&
        'endDate' in item
    )
  );
};

export const useReservationStorage = (initialReservations: Reservation[]) => {
  const [reservations, setReservations, { loading, error }] = useSafeLocalStorage<Reservation[]>(
    'cg_reservations',
    initialReservations,
    { validator: isReservationArray }
  );

  const addReservation = useCallback(
    (reservation: Reservation) => {
      setReservations([...reservations, reservation]);
    },
    [reservations, setReservations]
  );

  const editReservation = useCallback(
    (updated: Reservation) => {
      setReservations(
        reservations.map(r => (r.id === updated.id ? updated : r))
      );
    },
    [reservations, setReservations]
  );

  const updateStatus = useCallback(
    (id: string, status: ReservationStatus) => {
      setReservations(
        reservations.map(r => (r.id === id ? { ...r, status } : r))
      );
    },
    [reservations, setReservations]
  );

  const archiveReservation = useCallback(
    (id: string) => {
      setReservations(
        reservations.map(r => (r.id === id ? { ...r, isArchived: true } : r))
      );
    },
    [reservations, setReservations]
  );

  return {
    reservations,
    setReservations,
    addReservation,
    editReservation,
    updateStatus,
    archiveReservation,
    loading,
    error,
  };
};
```

#### Crear `hooks/useTransactionStorage.ts`:

```typescript
// src/hooks/useTransactionStorage.ts
import { useCallback } from 'react';
import { Transaction } from '../types';
import { useSafeLocalStorage } from './useSafeLocalStorage';

const isTransactionArray = (data: unknown): data is Transaction[] => {
  return (
    Array.isArray(data) &&
    data.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'date' in item &&
        'amount' in item &&
        'type' in item
    )
  );
};

export const useTransactionStorage = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions, { loading, error }] = useSafeLocalStorage<Transaction[]>(
    'cg_transactions',
    initialTransactions,
    { validator: isTransactionArray }
  );

  const addTransaction = useCallback(
    (transaction: Transaction) => {
      setTransactions([...transactions, transaction]);
    },
    [transactions, setTransactions]
  );

  const editTransaction = useCallback(
    (updated: Transaction) => {
      setTransactions(
        transactions.map(t => (t.id === updated.id ? updated : t))
      );
    },
    [transactions, setTransactions]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions(transactions.filter(t => t.id !== id));
    },
    [transactions, setTransactions]
  );

  return {
    transactions,
    setTransactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    loading,
    error,
  };
};
```

---

### **Fase 3: Crear Context para Estado Compartido**

**Duración**: 6-8 horas

#### Crear `contexts/ClientContext.tsx`:

```typescript
// src/contexts/ClientContext.tsx
import React, { createContext, useContext } from 'react';
import { Client } from '../types';
import { useClientStorage } from '../hooks/useClientStorage';

interface ClientContextType {
  clients: Client[];
  addClient: (client: Client) => void;
  editClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  loading: boolean;
  error: Error | null;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

interface ClientProviderProps {
  children: React.ReactNode;
  initialClients: Client[];
}

export const ClientProvider: React.FC<ClientProviderProps> = ({
  children,
  initialClients,
}) => {
  const storage = useClientStorage(initialClients);

  return (
    <ClientContext.Provider value={storage}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within ClientProvider');
  }
  return context;
};
```

#### Similar para `ReservationContext.tsx` y `TransactionContext.tsx`...

---

### **Fase 4: Extraer Lógica de Cálculos**

**Duración**: 4-6 horas

#### Crear `services/calculations/occupancyCalculator.ts`:

```typescript
// src/services/calculations/occupancyCalculator.ts
import { Reservation, ReservationStatus } from '../../types';

interface OccupancyMetrics {
  occupancyRate: string;
  occupiedNights: number;
  totalCapacityNights: number;
}

/**
 * Calcula la tasa de ocupación del mes actual
 * @param reservations - Lista de reservas confirmadas
 * @param totalAvailableCabins - Número total de cabañas
 * @param date - Fecha para cálculo (por defecto hoy)
 * @returns Métricas de ocupación
 */
export const calculateMonthOccupancy = (
  reservations: Reservation[],
  totalAvailableCabins: number,
  date: Date = new Date()
): OccupancyMetrics => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = endOfMonth.getDate();

  const totalCapacityNights = daysInMonth * totalAvailableCabins;
  let occupiedNights = 0;

  reservations.forEach(res => {
    if (
      res.status === ReservationStatus.CANCELLED ||
      res.status === ReservationStatus.INFORMATION
    ) {
      return;
    }

    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    const overlapStart = resStart < startOfMonth ? startOfMonth : resStart;
    const overlapEnd = resEnd > endOfMonth ? endOfMonth : resEnd;

    if (overlapStart < overlapEnd) {
      const overlapDays = Math.ceil(
        (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 3600 * 24)
      );
      occupiedNights += overlapDays * res.cabinCount;
    }
  });

  const occupancyRate =
    totalCapacityNights > 0
      ? ((occupiedNights / totalCapacityNights) * 100).toFixed(0)
      : '0';

  return {
    occupancyRate,
    occupiedNights,
    totalCapacityNights,
  };
};

/**
 * Calcula ADR (Average Daily Rate)
 */
export const calculateADR = (
  confirmedReservations: Reservation[]
): number => {
  if (confirmedReservations.length === 0) return 0;

  const totalRevenueConfirmed = confirmedReservations.reduce(
    (acc, r) => acc + r.totalAmount,
    0
  );

  const totalNightsBooked = confirmedReservations.reduce((acc, r) => {
    const duration = Math.ceil(
      (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) /
      (1000 * 3600 * 24)
    );
    return acc + duration * r.cabinCount;
  }, 0);

  return totalNightsBooked > 0
    ? Math.round(totalRevenueConfirmed / totalNightsBooked)
    : 0;
};

/**
 * Calcula RevPAR (Revenue Per Available Room)
 */
export const calculateRevPAR = (
  occupancyRate: number,
  adr: number
): number => {
  return Math.round((occupancyRate / 100) * adr);
};
```

#### Tests:

```typescript
// src/services/calculations/__tests__/occupancyCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateMonthOccupancy, calculateADR } from '../occupancyCalculator';
import { Reservation, ReservationStatus } from '../../../types';

describe('Occupancy Calculator', () => {
  it('should calculate 100% occupancy for fully booked month', () => {
    const reservations: Reservation[] = [
      {
        id: '1',
        clientId: '1',
        cabinCount: 3,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        adults: 2,
        children: 0,
        totalAmount: 10000,
        status: ReservationStatus.CONFIRMED,
      },
    ];

    const result = calculateMonthOccupancy(reservations, 3, new Date(2024, 0, 15));

    expect(result.occupancyRate).toBe('100');
    expect(result.occupiedNights).toBe(90); // 30 días * 3 cabañas
  });

  it('should return 0% for month with no reservations', () => {
    const result = calculateMonthOccupancy([], 3);
    expect(result.occupancyRate).toBe('0');
  });

  it('should exclude cancelled reservations', () => {
    const reservations: Reservation[] = [
      {
        id: '1',
        clientId: '1',
        cabinCount: 3,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        adults: 2,
        children: 0,
        totalAmount: 10000,
        status: ReservationStatus.CANCELLED,
      },
    ];

    const result = calculateMonthOccupancy(reservations, 3);
    expect(result.occupancyRate).toBe('0');
  });
});
```

---

### **Fase 5: Actualizar App.tsx con Contexts y Hooks**

**Duración**: 4-6 horas

```typescript
// src/App.tsx (Nueva versión)
import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ClientProvider } from './contexts/ClientContext';
import { ReservationProvider } from './contexts/ReservationContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRouter } from './routes';
import { INITIAL_CLIENTS, INITIAL_RESERVATIONS, INITIAL_TRANSACTIONS } from './utils/constants';

export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ClientProvider initialClients={INITIAL_CLIENTS}>
          <ReservationProvider initialReservations={INITIAL_RESERVATIONS}>
            <TransactionProvider initialTransactions={INITIAL_TRANSACTIONS}>
              <AppRouter />
            </TransactionProvider>
          </ReservationProvider>
        </ClientProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
```

---

### **Fase 6: Crear Container Components**

**Duración**: 6-8 horas

#### Ejemplo: `containers/DashboardContainer.tsx`:

```typescript
// src/containers/DashboardContainer.tsx
import React from 'react';
import { Dashboard } from '../components/organisms/Dashboard';
import { useClients } from '../contexts/ClientContext';
import { useReservations } from '../contexts/ReservationContext';
import { useTransactions } from '../contexts/TransactionContext';

interface DashboardContainerProps {
  totalAvailableCabins: number;
}

/**
 * Smart component que maneja lógica y proporciona datos al Dashboard dumb
 */
export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  totalAvailableCabins,
}) => {
  const { transactions, loading: txnLoading, error: txnError } = useTransactions();
  const { reservations, loading: resLoading, error: resError } = useReservations();
  const { clients } = useClients();

  // Mostrar loading o error
  if (txnLoading || resLoading) {
    return <div>Cargando...</div>;
  }

  if (txnError || resError) {
    return (
      <div className="bg-red-50 p-4 rounded">
        Error cargando datos: {txnError?.message || resError?.message}
      </div>
    );
  }

  return (
    <Dashboard
      transactions={transactions}
      reservations={reservations}
      totalAvailableCabins={totalAvailableCabins}
    />
  );
};
```

---

## ✅ Checklist de Refactorización

- [ ] **Fase 1**: Crear estructura base
  - [ ] Crear todas las carpetas
  - [ ] Mover componentes sin cambiar código
  - [ ] Verificar que todo sigue compilando

- [ ] **Fase 2**: Extraer hooks
  - [ ] `useClientStorage`
  - [ ] `useReservationStorage`
  - [ ] `useTransactionStorage`
  - [ ] Tests para cada hook

- [ ] **Fase 3**: Context API
  - [ ] `ClientProvider` & `useClients`
  - [ ] `ReservationProvider` & `useReservations`
  - [ ] `TransactionProvider` & `useTransactions`
  - [ ] `NotificationProvider`

- [ ] **Fase 4**: Lógica de Cálculos
  - [ ] `occupancyCalculator.ts`
  - [ ] `kpiCalculator.ts`
  - [ ] `financialCalculator.ts`
  - [ ] Tests para cada uno

- [ ] **Fase 5**: Actualizar App.tsx
  - [ ] Wrapping con providers
  - [ ] Actualizar imports
  - [ ] Validar compilación

- [ ] **Fase 6**: Container Components
  - [ ] `DashboardContainer`
  - [ ] `ReservationContainer`
  - [ ] `FinanceContainer`
  - [ ] `ClientContainer`

- [ ] **Testing**: Agregar 30+ tests
- [ ] **Documentation**: JSDoc en todos los puntos de entrada

---

## 📈 Beneficios Post-Refactorización

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Componentes Reutilizables** | 0% | 70%+ |
| **Lógica Testeable** | 10% | 85%+ |
| **Fácil de Mantener** | ❌ | ✅ |
| **Performance** | Media | Alta |
| **Lines of Code** | 1500 (App.tsx) | 200 (App.tsx) |
| **Componentes < 200LOC** | 40% | 95% |
| **Escalabilidad** | Limitada | Excelente |

---

## 🚀 Próximas Mejoras Post-Refactorización

1. **Routing**: Implementar React Router v7
2. **State Management**: Considerary Zustand (más ligero que Redux)
3. **API**: Backend Node.js/Express para Gemini proxy
4. **Testing**: E2E con Playwright
5. **Analytics**: Tracking de eventos
6. **PWA**: Mejorar offline functionality

