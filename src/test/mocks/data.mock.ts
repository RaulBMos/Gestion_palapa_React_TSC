/**
 * Centralized Mock Data
 * Provides consistent objects for testing across services and components.
 */

import { Client, Reservation, Transaction, ReservationStatus, TransactionType, PaymentMethod } from '@/types';

// ============================================================================
// CLIENT MOCKS
// ============================================================================

export const MOCK_CLIENT_1: Client = {
    id: 'client-1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '5551234567',
    notes: 'Cliente frecuente',
};

export const MOCK_CLIENT_2: Client = {
    id: 'client-2',
    name: 'María García',
    email: 'maria@example.com',
    phone: '5559876543',
};

export const MOCK_CLIENTS = [MOCK_CLIENT_1, MOCK_CLIENT_2];

// Database representation (snake_case)
export const DB_CLIENT_1 = {
    id: MOCK_CLIENT_1.id,
    name: MOCK_CLIENT_1.name,
    email: MOCK_CLIENT_1.email,
    phone: MOCK_CLIENT_1.phone,
    notes: MOCK_CLIENT_1.notes,
    user_id: 'user-123',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
};

// ============================================================================
// RESERVATION MOCKS
// ============================================================================

export const MOCK_RESERVATION_1: Reservation = {
    id: 'res-1',
    clientId: 'client-1',
    cabinCount: 2,
    startDate: '2026-02-14',
    endDate: '2026-02-16',
    adults: 4,
    children: 2,
    totalAmount: 4500,
    status: 'Confirmada' as ReservationStatus,
    isArchived: false,
};

export const MOCK_RESERVATIONS = [MOCK_RESERVATION_1];

// Database representation
export const DB_RESERVATION_1 = {
    id: MOCK_RESERVATION_1.id,
    client_id: MOCK_RESERVATION_1.clientId,
    cabin_count: MOCK_RESERVATION_1.cabinCount,
    start_date: MOCK_RESERVATION_1.startDate,
    end_date: MOCK_RESERVATION_1.endDate,
    adults: MOCK_RESERVATION_1.adults,
    children: MOCK_RESERVATION_1.children,
    total_amount: MOCK_RESERVATION_1.totalAmount,
    status: 'Confirmada',
    is_archived: false,
    user_id: 'user-123',
    created_at: '2026-01-15T12:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
    deleted_at: null,
};

// ============================================================================
// TRANSACTION MOCKS
// ============================================================================

export const MOCK_TRANSACTION_1: Transaction = {
    id: 'tx-1',
    date: '2026-01-20',
    amount: 2000,
    type: 'Ingreso' as TransactionType,
    category: 'Renta',
    description: 'Anticipo reservación 1',
    paymentMethod: 'Transferencia' as PaymentMethod,
    reservationId: 'res-1',
};

export const MOCK_TRANSACTIONS = [MOCK_TRANSACTION_1];

// Database representation
export const DB_TRANSACTION_1 = {
    id: MOCK_TRANSACTION_1.id,
    date: MOCK_TRANSACTION_1.date,
    amount: MOCK_TRANSACTION_1.amount,
    type: 'Ingreso',
    category: 'Renta',
    description: MOCK_TRANSACTION_1.description,
    payment_method: 'Transferencia',
    reservation_id: 'res-1',
    user_id: 'user-123',
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z',
    deleted_at: null,
};

// ============================================================================
// SYSTEM CONFIG MOCKS
// ============================================================================

export const MOCK_SYSTEM_CONFIG = {
    total_cabins: 5,
    maintenance_mode: false,
    daily_rate: 1500,
};
