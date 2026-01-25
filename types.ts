export enum PaymentMethod {
  CASH = 'Efectivo',
  TRANSFER = 'Transferencia',
}

export enum TransactionType {
  INCOME = 'Ingreso',
  EXPENSE = 'Gasto',
}

export enum ReservationStatus {
  INFORMATION = 'Información', // Changed from PENDING
  CONFIRMED = 'Confirmada',
  COMPLETED = 'Completada',
  CANCELLED = 'Cancelada',
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  clientId: string;
  cabinCount: number; // Changed from specific ID to quantity
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  adults: number; // Adults and Children > 5
  children: number; // Children < 5
  totalAmount: number;
  status: ReservationStatus;
  isArchived?: boolean; // New flag to move Information items to history without cancelling
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  reservationId?: string; // Optional link to a reservation
}

export type ViewState = 'dashboard' | 'reservations' | 'finances' | 'clients';