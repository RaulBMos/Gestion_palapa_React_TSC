// Tipos para utilidades de calendario

export type ReservationStatus = 'INFORMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Reservation {
  id: string;
  clientId: string;
  cabinCount: number;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  category?: string;
  notes?: string;
}

export interface OccupancyData {
  occupiedCount: number;
  activeReservations: Reservation[];
}

export interface CalendarDayInfo {
  date: Date;
  dateStr: string;
  occupiedCount: number;
  availableCount: number;
  activeReservations: Reservation[];
  isSelected: boolean;
  isInRange: boolean;
  isStart: boolean;
  isEnd: boolean;
  bgColor: string;
  textColor: string;
  borderColor: string;
  isFullyOccupied: boolean;
  isPartiallyOccupied: boolean;
}

export interface CalendarNewReservation {
  id: string;
  clientId: string;
  cabinCount: number;
  startDate: string;
  endDate: string;
  status?: ReservationStatus;
  category?: string;
  notes?: string;
}