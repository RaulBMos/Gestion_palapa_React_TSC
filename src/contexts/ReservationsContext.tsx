import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Reservation,
  ReservationStatus,
} from '@/types';
import { StorageAdapter } from '@/services/storageAdapter';
import { logError, logInfo } from '@/utils/logger';

export const TOTAL_CABINS = 3;
const PAGE_SIZE = 20;

export interface ReservationsContextValue {
  data: Reservation[];
  count: number | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  totalCabins: number;
  addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservation: (reservation: Reservation) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  archiveReservation: (id: string) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
}

const ReservationsContext = createContext<ReservationsContextValue | undefined>(undefined);

export function ReservationsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Reservation[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await StorageAdapter.getReservations({
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setData(result.data);
      setCount(result.count);
      logInfo('Paginated reservations loaded', { page: currentPage, pageSize: PAGE_SIZE, count: result.count });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching reservations';
      setError(message);
      logError(err as Error, { component: 'ReservationsContext', action: 'fetchReservations', page: currentPage });
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const refresh = useCallback(async () => fetchPage(), [fetchPage]);

  const addReservation = useCallback(async (reservation: Omit<Reservation, 'id'>) => {
    try {
      await StorageAdapter.addReservation(reservation);
      await fetchPage();
      logInfo('Reservation added through context');
    } catch (err) {
      logError(err as Error, { component: 'ReservationsContext', action: 'addReservation' });
      throw err;
    }
  }, [fetchPage]);

  const updateReservation = useCallback(async (reservation: Reservation) => {
    try {
      await StorageAdapter.updateReservation(reservation);
      await fetchPage();
      logInfo('Reservation updated through context', { reservationId: reservation.id });
    } catch (err) {
      logError(err as Error, { component: 'ReservationsContext', action: 'updateReservation' });
      throw err;
    }
  }, [fetchPage]);

  const updateReservationStatus = useCallback(async (id: string, status: ReservationStatus) => {
    try {
      await StorageAdapter.updateReservationStatus(id, status);
      await fetchPage();
      logInfo('Reservation status updated via context', { reservationId: id, status });
    } catch (err) {
      logError(err as Error, { component: 'ReservationsContext', action: 'updateReservationStatus' });
      throw err;
    }
  }, [fetchPage]);

  const archiveReservation = useCallback(async (id: string) => {
    try {
      await StorageAdapter.archiveReservation(id);
      await fetchPage();
      logInfo('Reservation archived via context', { reservationId: id });
    } catch (err) {
      logError(err as Error, { component: 'ReservationsContext', action: 'archiveReservation' });
      throw err;
    }
  }, [fetchPage]);

  const deleteReservation = useCallback(async (id: string) => {
    try {
      await StorageAdapter.deleteReservation(id);
      await fetchPage();
      logInfo('Reservation deleted via context', { reservationId: id });
    } catch (err) {
      logError(err as Error, { component: 'ReservationsContext', action: 'deleteReservation' });
      throw err;
    }
  }, [fetchPage]);

  const value = useMemo<ReservationsContextValue>(
    () => ({
      data,
      count,
      loading,
      error,
      currentPage,
      pageSize: PAGE_SIZE,
      setPage: setCurrentPage,
      refresh,
      totalCabins: TOTAL_CABINS,
      addReservation,
      updateReservation,
      updateReservationStatus,
      archiveReservation,
      deleteReservation,
    }),
    [data, count, loading, error, currentPage, refresh, addReservation, updateReservation, updateReservationStatus, archiveReservation, deleteReservation]
  );

  return <ReservationsContext value={value}>{children}</ReservationsContext>;
}

export function useReservationsContext() {
  const context = useContext(ReservationsContext);
  if (!context) {
    throw new Error('useReservationsContext must be used within ReservationsProvider');
  }
  return context;
}

export { ReservationsContext };
