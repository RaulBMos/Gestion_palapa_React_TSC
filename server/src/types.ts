/**
 * Tipos para las transacciones y reservaciones
 * Deben coincidir con los tipos del frontend (../types.ts)
 */

export enum PaymentMethod {
  CASH = 'Efectivo',
  TRANSFER = 'Transferencia',
}

export enum TransactionType {
  INCOME = 'Ingreso',
  EXPENSE = 'Gasto',
}

export enum ReservationStatus {
  INFORMATION = 'Información',
  CONFIRMED = 'Confirmada',
  COMPLETED = 'Completada',
  CANCELLED = 'Cancelada',
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  reservationId?: string;
}

export interface Reservation {
  id: string;
  clientId: string;
  cabinCount: number;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  adults: number;
  children: number;
  totalAmount: number;
  status: ReservationStatus;
  isArchived?: boolean;
}
