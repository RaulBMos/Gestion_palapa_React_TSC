import React, { createContext, useCallback, useMemo } from 'react';
import {
  Client,
  Reservation,
  Transaction,
  ReservationStatus,
  TransactionType,
  PaymentMethod,
} from '../types';
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

export interface DataContextType {
  // Estado
  clients: Client[];
  reservations: Reservation[];
  transactions: Transaction[];
  totalCabins: number;

  // Acciones - Clientes
  addClient: (client: Client) => void;
  editClient: (updatedClient: Client) => void;
  deleteClient: (id: string) => void;

  // Acciones - Reservaciones
  addReservation: (reservation: Reservation) => void;
  editReservation: (updatedReservation: Reservation) => void;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  archiveReservation: (id: string) => void;

  // Acciones - Transacciones
  addTransaction: (transaction: Transaction) => void;
  editTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
}

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
  const addClient = useCallback((client: Client) => {
    setClients([...clients, client]);
  }, [clients, setClients]);

  const editClient = useCallback((updatedClient: Client) => {
    setClients(clients.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
  }, [clients, setClients]);

  const deleteClient = useCallback((id: string) => {
    setClients(clients.filter((c) => c.id !== id));
  }, [clients, setClients]);

  // ✅ ACCIONES - TRANSACCIONES (helper)
  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
  }, [transactions, setTransactions]);

  // ✅ ACCIONES - RESERVACIONES
  const addReservation = useCallback(
    (reservation: Reservation) => {
      setReservations([...reservations, reservation]);

      // Crear transacción automáticamente si está confirmada
      if (reservation.status === ReservationStatus.CONFIRMED) {
        const transaction: Transaction = {
          id: `t-${Date.now()}`,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          amount: reservation.totalAmount,
          type: TransactionType.INCOME,
          category: 'Renta',
          description: `Reserva nueva ${reservation.id} (${reservation.cabinCount} cabañas)`,
          paymentMethod: PaymentMethod.TRANSFER,
          reservationId: reservation.id,
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

      // Acciones - Clientes
      addClient,
      editClient,
      deleteClient,

      // Acciones - Reservaciones
      addReservation,
      editReservation,
      updateReservationStatus,
      archiveReservation,

      // Acciones - Transacciones
      addTransaction,
      editTransaction,
      deleteTransaction,
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
