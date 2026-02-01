/**
 * Tests for Storage Adapter
 * Using a controlled localStorage mock to avoid JSDOM reference issues.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import {
    StorageAdapter,
    backupLocalStorage,
    restoreFromBackup,
    migrateLocalStorageToSupabase,
    STORAGE_KEYS,
} from '../storageAdapter';
import {
    MOCK_CLIENT_1,
    MOCK_CLIENTS,
    MOCK_RESERVATION_1,
    MOCK_RESERVATIONS,
    MOCK_TRANSACTION_1,
    MOCK_TRANSACTIONS,
} from '../../test/mocks/data.mock';
import { ReservationStatus } from '../../types';
import * as SupabaseService from '../supabaseService';
import * as SupabaseConfig from '../../config/supabase';
import * as Logger from '../../utils/logger';

// Mock Dependencies
vi.mock('../supabaseService');
vi.mock('../../config/supabase');
vi.mock('../../utils/logger');

describe('StorageAdapter', () => {
    // Manual in-memory store for the mock
    let store: Record<string, string> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        store = {};

        // Standard localStorage mock implementation
        const localStorageMock = {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
            removeItem: vi.fn((key) => { delete store[key]; }),
            clear: vi.fn(() => { store = {}; }),
            length: 0,
            key: vi.fn(),
        };

        // Apply mock to both global and window
        Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
        Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
    });

    it('should save data to localStorage correctly', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);

        await StorageAdapter.addClient(MOCK_CLIENT_1);

        expect(localStorage.setItem).toHaveBeenCalled();
        const result = await StorageAdapter.getClients();
        expect(result).toHaveLength(1);
        const client = result[0];
        expect(client).toBeDefined();
        expect(client!.name).toBe(MOCK_CLIENT_1.name);
    });

    it('should backup all local data', () => {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));
        localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(MOCK_RESERVATIONS));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));

        const backup = backupLocalStorage();

        expect(backup.clients).toHaveLength(MOCK_CLIENTS.length);
        expect(backup.reservations).toHaveLength(MOCK_RESERVATIONS.length);
    });

    it('should return empty list when localStorage read fails', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const getItemMock = localStorage.getItem as unknown as Mock;
        getItemMock.mockImplementationOnce(() => { throw new Error('read fail'); });

        const result = await StorageAdapter.getClients();

        expect(result).toEqual([]);
    });

    it('should fetch from Supabase when cloud is enabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.fetchClients).mockResolvedValue(MOCK_CLIENTS);

        const result = await StorageAdapter.getClients();

        expect(SupabaseService.fetchClients).toHaveBeenCalled();
        expect(result).toHaveLength(MOCK_CLIENTS.length);
    });

    it('should fallback to local clients when Supabase fails', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.fetchClients).mockRejectedValue(new Error('network'));
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));

        const result = await StorageAdapter.getClients();

        expect(result).toEqual(MOCK_CLIENTS);
    });

    it('should delegate addClient to Supabase when enabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.createClient).mockResolvedValue(MOCK_CLIENT_1);

        const { id: _clientId, ...clientInput } = MOCK_CLIENT_1;
        void _clientId;

        const result = await StorageAdapter.addClient(clientInput);

        expect(SupabaseService.createClient).toHaveBeenCalledWith(clientInput);
        expect(result).toEqual(MOCK_CLIENT_1);
    });

    it('should swallow errors when saving to localStorage fails', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const setItemMock = localStorage.setItem as unknown as Mock;
        setItemMock.mockImplementationOnce(() => { throw new Error('write fail'); });

        const { id: _clientId, ...clientInput } = MOCK_CLIENT_1;
        void _clientId;

        const result = await StorageAdapter.addClient(clientInput);

        expect(result.name).toBe(MOCK_CLIENT_1.name);
    });

    it('should delegate updateClient to Supabase when enabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.updateClient).mockResolvedValue(MOCK_CLIENT_1);

        const result = await StorageAdapter.updateClient(MOCK_CLIENT_1);

        expect(SupabaseService.updateClient).toHaveBeenCalledWith(MOCK_CLIENT_1);
        expect(result).toEqual(MOCK_CLIENT_1);
    });

    it('should add reservations locally when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const { id: _reservationId, ...reservationInput } = MOCK_RESERVATION_1;
        void _reservationId;

        const result = await StorageAdapter.addReservation(reservationInput);

        expect(result.id).toMatch(/^reservation_/);
        const stored = await StorageAdapter.getReservations();
        expect(stored).toHaveLength(1);
    });

    it('should update reservation status locally when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const reservation = { ...MOCK_RESERVATION_1 };
        localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify([reservation]));

        await StorageAdapter.updateReservationStatus(reservation.id, ReservationStatus.CANCELLED);

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || '[]');
        expect(stored[0].status).toBe(ReservationStatus.CANCELLED);
    });

    it('should archive reservations locally when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const reservation = { ...MOCK_RESERVATION_1, isArchived: false };
        localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify([reservation]));

        await StorageAdapter.archiveReservation(reservation.id);

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || '[]');
        expect(stored[0].isArchived).toBe(true);
    });

    it('should delete reservations locally when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const reservation = { ...MOCK_RESERVATION_1 };
        localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify([reservation]));

        await StorageAdapter.deleteReservation(reservation.id);

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || '[]');
        expect(stored).toHaveLength(0);
    });

    it('should delegate deleteClient to Supabase when enabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.deleteClient).mockResolvedValue(undefined);

        await StorageAdapter.deleteClient(MOCK_CLIENT_1.id);

        expect(SupabaseService.deleteClient).toHaveBeenCalledWith(MOCK_CLIENT_1.id);
    });

    it('should fetch reservations from Supabase and fallback on error', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.fetchReservations).mockResolvedValue(MOCK_RESERVATIONS);

        const supabaseData = await StorageAdapter.getReservations();
        expect(supabaseData).toEqual(MOCK_RESERVATIONS);

        vi.mocked(SupabaseService.fetchReservations).mockRejectedValueOnce(new Error('fail'));
        localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(MOCK_RESERVATIONS));

        const fallbackData = await StorageAdapter.getReservations();
        expect(fallbackData).toEqual(MOCK_RESERVATIONS);
    });

    it('should update reservation status through Supabase when enabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.updateReservationStatus).mockResolvedValue(undefined);

        await StorageAdapter.updateReservationStatus('res-1', ReservationStatus.CONFIRMED);

        expect(SupabaseService.updateReservationStatus).toHaveBeenCalledWith('res-1', ReservationStatus.CONFIRMED);
    });

    it('should fetch transactions from Supabase and fallback on error', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.fetchTransactions).mockResolvedValue(MOCK_TRANSACTIONS);

        const remoteTransactions = await StorageAdapter.getTransactions();
        expect(remoteTransactions).toEqual(MOCK_TRANSACTIONS);

        vi.mocked(SupabaseService.fetchTransactions).mockRejectedValueOnce(new Error('nope'));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(MOCK_TRANSACTIONS));

        const fallbackTransactions = await StorageAdapter.getTransactions();
        expect(fallbackTransactions).toEqual(MOCK_TRANSACTIONS);
    });

    it('should delete transactions via Supabase when enabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.deleteTransaction).mockResolvedValue(undefined);

        await StorageAdapter.deleteTransaction(MOCK_TRANSACTION_1.id);

        expect(SupabaseService.deleteTransaction).toHaveBeenCalledWith(MOCK_TRANSACTION_1.id);
    });

    it('should manage transactions locally when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const { id: _txId, ...transactionInput } = MOCK_TRANSACTION_1;
        void _txId;

        const created = await StorageAdapter.addTransaction(transactionInput);
        expect(created.id).toMatch(/^transaction_/);

        const updated = await StorageAdapter.updateTransaction({ ...created, amount: created.amount + 100 });
        expect(updated.amount).toBe(created.amount + 100);

        await StorageAdapter.deleteTransaction(updated.id);
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
        expect(stored).toHaveLength(0);
    });

    it('should migrate localStorage data to Supabase', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));
        localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(MOCK_RESERVATIONS));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(MOCK_TRANSACTIONS));

        vi.mocked(SupabaseService.createClient).mockImplementation(async (client) => ({
            ...client,
            id: client.name,
        } as typeof MOCK_CLIENT_1));
        const reservationMock = MOCK_RESERVATIONS[0]!;
        vi.mocked(SupabaseService.createReservation).mockResolvedValue(reservationMock);
        vi.mocked(SupabaseService.createTransaction).mockResolvedValue(MOCK_TRANSACTION_1);

        const result = await migrateLocalStorageToSupabase();

        expect(result.success).toBe(true);
        expect(result.migrated.clients).toBe(MOCK_CLIENTS.length);
        expect(result.migrated.reservations).toBe(MOCK_RESERVATIONS.length);
        expect(result.migrated.transactions).toBe(MOCK_TRANSACTIONS.length);
        expect(result.errors).toHaveLength(0);
    });

    it('should aggregate migration errors when Supabase calls fail', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS.slice(0, 1)));
        localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(MOCK_RESERVATIONS.slice(0, 1)));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(MOCK_TRANSACTIONS.slice(0, 1)));

        vi.mocked(SupabaseService.createClient).mockRejectedValue(new Error('client fail'));
        vi.mocked(SupabaseService.createReservation).mockRejectedValue(new Error('reservation fail'));
        vi.mocked(SupabaseService.createTransaction).mockRejectedValue(new Error('transaction fail'));

        const result = await migrateLocalStorageToSupabase();

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(3);
    });

    it('should abort migration when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);

        const result = await migrateLocalStorageToSupabase();

        expect(result.success).toBe(false);
        expect(result.errors[0]).toMatch(/Supabase is not enabled/);
    });

    it('should capture unexpected migration failures', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        const logInfoMock = Logger.logInfo as Mock;
        logInfoMock.mockImplementationOnce(() => { throw new Error('logger boom'); });

        const result = await migrateLocalStorageToSupabase();

        expect(result.success).toBe(false);
        expect(result.errors[0]).toMatch(/Migration failed/);
    });

    it('should restore data from backup payload', () => {
        restoreFromBackup({
            clients: MOCK_CLIENTS,
            reservations: MOCK_RESERVATIONS,
            transactions: MOCK_TRANSACTIONS,
        });

        expect(localStorage.setItem).toHaveBeenCalledWith(
            STORAGE_KEYS.CLIENTS,
            JSON.stringify(MOCK_CLIENTS)
        );
        expect(localStorage.setItem).toHaveBeenCalledWith(
            STORAGE_KEYS.RESERVATIONS,
            JSON.stringify(MOCK_RESERVATIONS)
        );
        expect(localStorage.setItem).toHaveBeenCalledWith(
            STORAGE_KEYS.TRANSACTIONS,
            JSON.stringify(MOCK_TRANSACTIONS)
        );
    });
});
