/**
 * Tests for Supabase Service
 * Corrected with proper withRetry mock.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    fetchReservations,
    createReservation,
    updateReservation,
    updateReservationStatus,
    archiveReservation,
    deleteReservation,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getSystemConfig,
    setSystemConfig,
    SupabaseError,
} from '../supabaseService';
import { createSupabaseMock, createSupabaseQueryMock } from '@/test/mocks/supabase.mock';
import {
    DB_CLIENT_1,
    MOCK_CLIENT_1,
    DB_RESERVATION_1,
    MOCK_RESERVATION_1,
    DB_TRANSACTION_1,
    MOCK_TRANSACTION_1,
    MOCK_SYSTEM_CONFIG,
} from '@/test/mocks/data.mock';
import { ReservationStatus } from '@/types';
import { getSupabaseClient } from '@/config/supabase';

// Mock Dependencies
vi.mock('@/config/supabase', () => ({
    getSupabaseClient: vi.fn(),
    USE_SUPABASE: true
}));

vi.mock('@/utils/logger', () => ({
    logError: vi.fn(),
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    logWarning: vi.fn(),
}));

// Mock withRetry to return a property formatted RetryResult
vi.mock('@/utils/retry', () => ({
    withRetry: vi.fn(async (fn) => {
        try {
            const data = await fn();
            return { success: true, data, attempts: 1, totalDelay: 0 };
        } catch (error) {
            return { success: false, error, attempts: 1, totalDelay: 0 };
        }
    }),
}));

describe('SupabaseService', () => {
    let mockSupabase: ReturnType<typeof createSupabaseMock>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = createSupabaseMock();
        vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase as unknown as SupabaseClient);

        // Default auth state
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'test-user-uuid' } },
            error: null
        });
    });

    it('should fetch clients successfully', async () => {
        mockSupabase.from.mockReturnValue(createSupabaseQueryMock({ data: [DB_CLIENT_1] }));
        const result = await fetchClients();
        expect(result).toHaveLength(1);
        const client = result[0];
        expect(client).toBeDefined();
        expect(client!.name).toBe(MOCK_CLIENT_1.name);
    });

    it('should throw SupabaseError on failure', async () => {
        mockSupabase.from.mockReturnValue(createSupabaseQueryMock({
            error: { message: 'Api Error', code: '500' }
        }));
        await expect(fetchClients()).rejects.toThrow();
    });

    it('should insert client data', async () => {
        mockSupabase.from.mockReturnValue(createSupabaseQueryMock({ data: DB_CLIENT_1 }));
        const result = await createClient(MOCK_CLIENT_1);
        expect(result.id).toBe(MOCK_CLIENT_1.id);
    });

    it('should fetch and map reservations', async () => {
        mockSupabase.from.mockReturnValue(createSupabaseQueryMock({ data: [DB_RESERVATION_1] }));
        const result = await fetchReservations();
        const reservation = result[0];
        expect(reservation).toBeDefined();
        expect(reservation!.cabinCount).toBe(MOCK_RESERVATION_1.cabinCount);
    });

    it('should get system config', async () => {
        mockSupabase.from.mockReturnValue(createSupabaseQueryMock({
            data: { value: MOCK_SYSTEM_CONFIG.total_cabins }
        }));
        const val = await getSystemConfig('total_cabins');
        expect(val).toBe(5);
    });

    it('should protect against unauthenticated calls', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
        await expect(fetchClients()).rejects.toThrow('No authenticated user found');
    });

    it('should update client details', async () => {
        const updatedDbClient = { ...DB_CLIENT_1, name: 'Cliente Actualizado' };
        const queryMock = createSupabaseQueryMock({ data: updatedDbClient });
        mockSupabase.from.mockReturnValue(queryMock);

        const result = await updateClient({ ...MOCK_CLIENT_1, name: 'Cliente Actualizado' });

        expect(queryMock.update).toHaveBeenCalledWith({
            name: 'Cliente Actualizado',
            email: MOCK_CLIENT_1.email,
            phone: MOCK_CLIENT_1.phone,
            notes: MOCK_CLIENT_1.notes,
        });
        expect(result.name).toBe('Cliente Actualizado');
    });

    it('should delete client softly', async () => {
        const mutationMock = createSupabaseQueryMock({});
        mockSupabase.from.mockReturnValue(mutationMock);

        await expect(deleteClient(MOCK_CLIENT_1.id)).resolves.toBeUndefined();

        expect(mutationMock.update).toHaveBeenCalledWith(expect.objectContaining({
            deleted_at: expect.any(String),
        }));
        expect(mutationMock.eq).toHaveBeenCalledWith('id', MOCK_CLIENT_1.id);
    });

    it('should throw when delete client fails', async () => {
        const mutationMock = createSupabaseQueryMock({
            error: { message: 'fail', code: '500' }
        });
        mockSupabase.from.mockReturnValue(mutationMock);

        await expect(deleteClient('client-404')).rejects.toBeInstanceOf(SupabaseError);
    });

    it('should create reservation records', async () => {
        const queryMock = createSupabaseQueryMock({ data: DB_RESERVATION_1 });
        mockSupabase.from.mockReturnValue(queryMock);

        const { id: _reservationId, ...reservationInput } = MOCK_RESERVATION_1;
        void _reservationId;

        const result = await createReservation(reservationInput);

        expect(queryMock.insert).toHaveBeenCalled();
        expect(result.id).toBe(MOCK_RESERVATION_1.id);
    });

    it('should update reservation details', async () => {
        const updatedDbReservation = { ...DB_RESERVATION_1, status: ReservationStatus.CANCELLED };
        const queryMock = createSupabaseQueryMock({ data: updatedDbReservation });
        mockSupabase.from.mockReturnValue(queryMock);

        const result = await updateReservation({ ...MOCK_RESERVATION_1, status: ReservationStatus.CANCELLED });

        expect(queryMock.update).toHaveBeenCalled();
        expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('should update reservation status flag', async () => {
        const mutationMock = createSupabaseQueryMock({});
        mockSupabase.from.mockReturnValue(mutationMock);

        const newStatus = ReservationStatus.CANCELLED;
        await expect(updateReservationStatus('res-1', newStatus)).resolves.toBeUndefined();

        expect(mutationMock.update).toHaveBeenCalledWith({ status: newStatus });
        expect(mutationMock.eq).toHaveBeenCalledWith('id', 'res-1');
    });

    it('should archive reservation', async () => {
        const mutationMock = createSupabaseQueryMock({});
        mockSupabase.from.mockReturnValue(mutationMock);

        await expect(archiveReservation('res-1')).resolves.toBeUndefined();
        expect(mutationMock.update).toHaveBeenCalledWith({ is_archived: true });
    });

    it('should delete reservation softly', async () => {
        const mutationMock = createSupabaseQueryMock({});
        mockSupabase.from.mockReturnValue(mutationMock);

        await expect(deleteReservation('res-1')).resolves.toBeUndefined();
        expect(mutationMock.update).toHaveBeenCalled();
    });

    it('should fetch transactions list', async () => {
        mockSupabase.from.mockReturnValue(createSupabaseQueryMock({ data: [DB_TRANSACTION_1] }));

        const result = await fetchTransactions();

        expect(result).toHaveLength(1);
        const transaction = result[0];
        expect(transaction).toBeDefined();
        expect(transaction!.amount).toBe(MOCK_TRANSACTION_1.amount);
    });

    it('should create a transaction entry', async () => {
        const queryMock = createSupabaseQueryMock({ data: DB_TRANSACTION_1 });
        mockSupabase.from.mockReturnValue(queryMock);

        const transactionInput = {
            date: MOCK_TRANSACTION_1.date,
            amount: MOCK_TRANSACTION_1.amount,
            type: MOCK_TRANSACTION_1.type,
            category: MOCK_TRANSACTION_1.category,
            description: MOCK_TRANSACTION_1.description,
            paymentMethod: MOCK_TRANSACTION_1.paymentMethod,
            reservationId: MOCK_TRANSACTION_1.reservationId,
        } as const;

        const result = await createTransaction(transactionInput);

        expect(queryMock.insert).toHaveBeenCalled();
        expect(result.id).toBe(MOCK_TRANSACTION_1.id);
    });

    it('should update transaction entry', async () => {
        const updatedDbTransaction = { ...DB_TRANSACTION_1, amount: 2500 };
        const queryMock = createSupabaseQueryMock({ data: updatedDbTransaction });
        mockSupabase.from.mockReturnValue(queryMock);

        const result = await updateTransaction({ ...MOCK_TRANSACTION_1, amount: 2500 });

        expect(queryMock.update).toHaveBeenCalled();
        expect(result.amount).toBe(2500);
    });

    it('should delete transaction softly', async () => {
        const mutationMock = createSupabaseQueryMock({});
        mockSupabase.from.mockReturnValue(mutationMock);

        await expect(deleteTransaction('tx-1')).resolves.toBeUndefined();
        expect(mutationMock.update).toHaveBeenCalled();
    });

    it('should return null when config key is missing', async () => {
        mockSupabase.from.mockReturnValue(createSupabaseQueryMock({
            error: { message: 'Not Found', code: 'PGRST116' }
        }));

        const result = await getSystemConfig('missing-key');
        expect(result).toBeNull();
    });

    it('should set system config values', async () => {
        const mutationMock = createSupabaseQueryMock({});
        mockSupabase.from.mockReturnValue(mutationMock);

        await expect(setSystemConfig('daily_rate', 2000, 'Tarifa diaria')).resolves.toBeUndefined();

        expect(mutationMock.upsert).toHaveBeenCalledWith({
            key: 'daily_rate',
            value: 2000,
            description: 'Tarifa diaria',
            user_id: 'test-user-uuid',
        });
    });

    it('should throw when system config update fails', async () => {
        const mutationMock = createSupabaseQueryMock({
            error: { message: 'Config error', code: '500' }
        });
        mockSupabase.from.mockReturnValue(mutationMock);

        await expect(setSystemConfig('daily_rate', 2000)).rejects.toBeInstanceOf(SupabaseError);
    });
});
