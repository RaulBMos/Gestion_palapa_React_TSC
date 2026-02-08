import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Client,
  Reservation,
  Transaction,
  ReservationStatus,
  DataContextType,
} from '@/types';
import { DataContext } from './DataContext';
import { StorageAdapter } from '@/services/storageAdapter';
import { logError, logInfo } from '@/utils/logger';

// ============================================================================
// CONSTANTES
// ============================================================================

const TOTAL_CABINS = 3;

// ============================================================================
// PROVEEDOR CON SUPABASE/LOCALSTORAGE
// ============================================================================

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Cargar datos al iniciar
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientsData, reservationsData, transactionsData] = await Promise.all([
        StorageAdapter.getClients(),
        StorageAdapter.getReservations(),
        StorageAdapter.getTransactions(),
      ]);

      setClients(clientsData);
      setReservations(reservationsData);
      setTransactions(transactionsData);

      logInfo('Data loaded successfully', {
        clients: clientsData.length,
        reservations: reservationsData.length,
        transactions: transactionsData.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading data';
      setError(errorMessage);
      logError(err as Error, { component: 'DataProvider', action: 'loadData' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ ACCIONES - CLIENTES
  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    try {
      const newClient = await StorageAdapter.addClient(client);
      setClients((prev) => [...prev, newClient]);
      logInfo('Client added', { id: newClient.id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'addClient' });
      throw err;
    }
  }, []);

  const editClient = useCallback(async (updatedClient: Client) => {
    try {
      await StorageAdapter.updateClient(updatedClient);
      setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
      logInfo('Client updated', { id: updatedClient.id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'editClient' });
      throw err;
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    try {
      await StorageAdapter.deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      logInfo('Client deleted', { id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'deleteClient' });
      throw err;
    }
  }, []);

  // ✅ ACCIONES - RESERVACIONES
  const addReservation = useCallback(async (reservation: Omit<Reservation, 'id'>) => {
    try {
      const newReservation = await StorageAdapter.addReservation(reservation);
      setReservations((prev) => [...prev, newReservation]);
      logInfo('Reservation added', { id: newReservation.id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'addReservation' });
      throw err;
    }
  }, []);

  const editReservation = useCallback(async (updatedReservation: Reservation) => {
    try {
      await StorageAdapter.updateReservation(updatedReservation);
      setReservations((prev) =>
        prev.map((r) => (r.id === updatedReservation.id ? updatedReservation : r))
      );
      logInfo('Reservation updated', { id: updatedReservation.id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'editReservation' });
      throw err;
    }
  }, []);

  const updateReservationStatus = useCallback(async (id: string, status: ReservationStatus) => {
    try {
      await StorageAdapter.updateReservationStatus(id, status);
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      logInfo('Reservation status updated', { id, status });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'updateReservationStatus' });
      throw err;
    }
  }, []);

  const archiveReservation = useCallback(async (id: string) => {
    try {
      await StorageAdapter.archiveReservation(id);
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, isArchived: true } : r)));
      logInfo('Reservation archived', { id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'archiveReservation' });
      throw err;
    }
  }, []);

  const deleteReservation = useCallback(async (id: string) => {
    try {
      await StorageAdapter.deleteReservation(id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      logInfo('Reservation deleted', { id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'deleteReservation' });
      throw err;
    }
  }, []);

  // ✅ ACCIONES - TRANSACCIONES
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = await StorageAdapter.addTransaction(transaction);
      setTransactions((prev) => [...prev, newTransaction]);
      logInfo('Transaction added', { id: newTransaction.id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'addTransaction' });
      throw err;
    }
  }, []);

  const editTransaction = useCallback(async (updatedTransaction: Transaction) => {
    try {
      await StorageAdapter.updateTransaction(updatedTransaction);
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );
      logInfo('Transaction updated', { id: updatedTransaction.id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'editTransaction' });
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await StorageAdapter.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      logInfo('Transaction deleted', { id });
    } catch (err) {
      logError(err as Error, { component: 'DataProvider', action: 'deleteTransaction' });
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Valor del contexto memoizado
  const value = useMemo<DataContextType>(
    () => ({
      // Estado
      clients,
      reservations,
      transactions,
      totalCabins: TOTAL_CABINS,
      loading,
      error,

      // Acciones - Clientes
      addClient,
      editClient,
      updateClient: editClient,
      deleteClient,

      // Acciones - Reservaciones
      addReservation,
      editReservation,
      updateReservation: editReservation,
      deleteReservation,
      updateReservationStatus,
      archiveReservation,

      // Acciones - Transacciones
      addTransaction,
      editTransaction,
      updateTransaction: editTransaction,
      deleteTransaction,

      // Utilidades
      refreshData: loadData,
      clearError,
    }),
    [
      clients,
      reservations,
      transactions,
      loading,
      error,
      addClient,
      editClient,
      deleteClient,
      addReservation,
      editReservation,
      updateReservationStatus,
      archiveReservation,
      deleteReservation,
      addTransaction,
      editTransaction,
      deleteTransaction,
      loadData,
      clearError,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
