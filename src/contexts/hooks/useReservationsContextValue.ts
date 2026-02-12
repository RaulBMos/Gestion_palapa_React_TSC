import React from 'react';
import { PAGE_SIZE, TOTAL_CABINS } from '../constants/ReservationsContext.constants';
import type { Reservation, ReservationStatus } from '@/types';
import type { ReservationsContextValue } from '../ReservationsContext';
export function useReservationsContextValue({
  data,
  count,
  loading,
  error,
  currentPage,
  setCurrentPage,
  refresh,
  addReservation,
  updateReservation,
  updateReservationStatus,
  archiveReservation,
  deleteReservation,
}: {
  data: Reservation[];
  count: number | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refresh: () => Promise<void>;
  addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservation: (reservation: Reservation) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  archiveReservation: (id: string) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
}): ReservationsContextValue {
  return React.useMemo(
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
    [data, count, loading, error, currentPage, setCurrentPage, refresh, addReservation, updateReservation, updateReservationStatus, archiveReservation, deleteReservation]
  );
}