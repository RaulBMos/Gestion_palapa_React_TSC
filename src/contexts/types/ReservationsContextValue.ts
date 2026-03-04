import { Reservation, ReservationStatus } from '@/types';
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