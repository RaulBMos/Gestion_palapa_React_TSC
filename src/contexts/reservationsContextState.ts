import { createContext, useContext } from 'react';
import { Reservation, ReservationStatus } from '@/types';

export const TOTAL_CABINS = 3;

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

export const ReservationsContext = createContext<ReservationsContextValue | undefined>(undefined);

export function useReservationsContext() {
  const context = useContext(ReservationsContext);
  if (!context) {
    throw new Error('useReservationsContext must be used within ReservationsProvider');
  }
  return context;
}
