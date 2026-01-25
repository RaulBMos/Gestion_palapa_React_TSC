import { useContext } from 'react';
import { DataContext, DataContextType } from '../contexts/DataContext';

/**
 * Hook personalizado para acceder al contexto de datos global
 * 
 * @returns DataContextType con todo el estado y acciones
 * @throws Error si se usa fuera del DataProvider
 * 
 * @example
 * function MyComponent() {
 *   const { clients, addClient } = useData();
 *   
 *   return (
 *     <div>
 *       {clients.map(client => (...))}
 *     </div>
 *   );
 * }
 */
export function useData(): DataContextType {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error(
      '❌ useData() debe ser usado dentro de <DataProvider>. ' +
      'Asegúrate de envolver tu aplicación con DataProvider en App.tsx'
    );
  }

  return context;
}

/**
 * Hook para acceder solo a los clientes
 */
export function useClients() {
  const { clients, addClient, editClient, deleteClient } = useData();
  return { clients, addClient, editClient, deleteClient };
}

/**
 * Hook para acceder solo a las reservaciones
 */
export function useReservations() {
  const {
    reservations,
    totalCabins,
    addReservation,
    editReservation,
    updateReservationStatus,
    archiveReservation,
  } = useData();
  return {
    reservations,
    totalCabins,
    addReservation,
    editReservation,
    updateReservationStatus,
    archiveReservation,
  };
}

/**
 * Hook para acceder solo a las transacciones
 */
export function useTransactions() {
  const { transactions, addTransaction, editTransaction, deleteTransaction } =
    useData();
  return { transactions, addTransaction, editTransaction, deleteTransaction };
}

/**
 * Hook para acceder solo a los datos de estado (sin acciones)
 */
export function useDataState() {
  const { clients, reservations, transactions, totalCabins } = useData();
  return { clients, reservations, transactions, totalCabins };
}
