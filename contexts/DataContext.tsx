import React, { createContext, useCallback, useMemo } from 'react';
import {
  Client,
  Reservation,
  Transaction,
  ReservationStatus,
  TransactionType,
  PaymentMethod,
  DataContextType,
} from '../src/types';
import { useSafeLocalStorage } from '../hooks/useSafeLocalStorage';

// ============================================================================
// CONSTANTES
// ============================================================================

const TOTAL_CABINS = 3;

const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+52 555 123 4567',
  },
  {
    id: '2',
    name: 'Maria Lopez',
    email: 'maria@example.com',
    phone: '+52 555 987 6543',
  },
  {
    id: '3',
    name: 'Carlos Ruiz',
    email: 'carlos@example.com',
    phone: '+52 555 111 2222',
  },
];

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: '101',
    clientId: '1',
    cabinCount: 1,
    startDate: '2024-03-10',
    endDate: '2024-03-15',
    adults: 2,
    children: 0,
    totalAmount: 5000,
    status: ReservationStatus.COMPLETED,
  },
  {
    id: '102',
    clientId: '2',
    cabinCount: 2,
    startDate: '2024-04-01',
    endDate: '2024-04-05',
    adults: 4,
    children: 2,
    totalAmount: 8000,
    status: ReservationStatus.CONFIRMED,
  },
  {
    id: '103',
    clientId: '3',
    cabinCount: 1,
    startDate: '2024-05-20',
    endDate: '2024-05-25',
    adults: 2,
    children: 0,
    totalAmount: 6000,
    status: ReservationStatus.INFORMATION,
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    date: '2024-03-10',
    amount: 5000,
    type: TransactionType.INCOME,
    category: 'Renta',
    description: 'Reserva #101',
    paymentMethod: PaymentMethod.TRANSFER,
    reservationId: '101',
  },
  {
    id: 't2',
    date: '2024-03-01',
    amount: 1500,
    type: TransactionType.EXPENSE,
    category: 'Mantenimiento',
    description: 'Reparación AC',
    paymentMethod: PaymentMethod.CASH,
  },
  {
    id: 't3',
    date: '2024-03-20',
    amount: 500,
    type: TransactionType.EXPENSE,
    category: 'Limpieza',
    description: 'Limpieza profunda',
    paymentMethod: PaymentMethod.CASH,
  },
  {
    id: 't4',
    date: '2024-04-01',
    amount: 4000,
    type: TransactionType.INCOME,
    category: 'Renta',
    description: 'Anticipo Reserva #102',
    paymentMethod: PaymentMethod.TRANSFER,
    reservationId: '102',
  },
  {
    id: 't5',
    date: '2024-04-02',
    amount: 800,
    type: TransactionType.EXPENSE,
    category: 'Servicios',
    description: 'Pago Internet',
    paymentMethod: PaymentMethod.TRANSFER,
  },
];

// ============================================================================
// TIPOS
// ============================================================================

// Use the DataContextType from types/index.ts
// Use DataContextType from types/index.ts
export type { DataContextType };

// ============================================================================
// CONTEXTO
// ============================================================================

export const DataContext = createContext<DataContextType | undefined>(undefined);

// ============================================================================
// PROVEEDOR
// ============================================================================

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  // ✅ Estado usando localStorage seguro
  const [clients, setClients] = useSafeLocalStorage<Client[]>(
    'cg_clients',
    INITIAL_CLIENTS
  );
  const [reservations, setReservations] = useSafeLocalStorage<Reservation[]>(
    'cg_reservations',
    INITIAL_RESERVATIONS
  );
  const [transactions, setTransactions] = useSafeLocalStorage<Transaction[]>(
    'cg_transactions',
    INITIAL_TRANSACTIONS
  );

  // ✅ ACCIONES - CLIENTES
  const addClient = useCallback((client: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
    };
    setClients([...clients, newClient]);
  }, [clients, setClients]);

  const editClient = useCallback((updatedClient: Client) => {
    setClients(clients.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
  }, [clients, setClients]);

  const deleteClient = useCallback((id: string) => {
    setClients(clients.filter((c) => c.id !== id));
  }, [clients, setClients]);

  // ✅ ACCIONES - TRANSACCIONES (helper)
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx-${Date.now()}`,
    };
    setTransactions([...transactions, newTransaction]);
  }, [transactions, setTransactions]);

  // ✅ ACCIONES - RESERVACIONES
  const addReservation = useCallback(
    (reservation: Omit<Reservation, 'id'>) => {
      const newReservation: Reservation = {
        ...reservation,
        id: `res-${Date.now()}`,
      };
      setReservations([...reservations, newReservation]);

      // Crear transacción automáticamente si está confirmada
      if (newReservation.status === ReservationStatus.CONFIRMED) {
        const transaction: Transaction = {
          id: `t-${Date.now()}`,
          date: new Date().toISOString().split('T')[0]!, // YYYY-MM-DD
          amount: newReservation.totalAmount,
          type: TransactionType.INCOME,
          category: 'Renta',
          description: `Reserva nueva ${newReservation.id || 'unknown'} (${newReservation.cabinCount} cabañas)`,
          paymentMethod: PaymentMethod.TRANSFER,
          ...(newReservation.id && { reservationId: newReservation.id }),
        };
        addTransaction(transaction);
      }
    },
    [reservations, setReservations, addTransaction]
  );

  const editReservation = useCallback((updatedReservation: Reservation) => {
    setReservations(
      reservations.map((r) => (r.id === updatedReservation.id ? updatedReservation : r))
    );
  }, [reservations, setReservations]);

  const updateReservationStatus = useCallback(
    (id: string, status: ReservationStatus) => {
      setReservations(
        reservations.map((r) => (r.id === id ? { ...r, status } : r))
      );
    },
    [reservations, setReservations]
  );

  const archiveReservation = useCallback((id: string) => {
    setReservations(
      reservations.map((r) => (r.id === id ? { ...r, isArchived: true } : r))
    );
  }, [reservations, setReservations]);

  // ✅ ACCIONES - TRANSACCIONES
  const editTransaction = useCallback((updatedTransaction: Transaction) => {
    setTransactions(
      transactions.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
  }, [transactions, setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  }, [transactions, setTransactions]);

  // ✅ Valor del contexto memoizado
  const value = useMemo<DataContextType>(
    () => ({
      // Estado
      clients,
      reservations,
      transactions,
      totalCabins: TOTAL_CABINS,
      loading: false,
      error: null,

      // Acciones - Clientes
      addClient,
      editClient,
      updateClient: editClient,
      deleteClient,

      // Acciones - Reservaciones
      addReservation,
      editReservation,
      updateReservation: editReservation,
      deleteReservation: (id: string) => {
        // Implementación simplificada - marcar como archivada
        archiveReservation(id);
      },
      updateReservationStatus,
      archiveReservation,

      // Acciones - Transacciones
      addTransaction,
      editTransaction,
      updateTransaction: editTransaction,
      deleteTransaction,
      refreshData: async () => {
        // No-op for localStorage implementation
      },
      clearError: () => {
        // No-op for localStorage implementation
      },
    }),
    [
      clients,
      reservations,
      transactions,
      addClient,
      editClient,
      deleteClient,
      addReservation,
      editReservation,
      updateReservationStatus,
      archiveReservation,
      addTransaction,
      editTransaction,
      deleteTransaction,
    ]
  );

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}
