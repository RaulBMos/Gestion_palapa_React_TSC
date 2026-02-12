/**
 * Tests for Storage Adapter
 * Using a controlled localStorage mock to avoid JSDOM reference issues.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import type { Reservation, Transaction } from '../../types';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import {
    StorageAdapter,
    backupLocalStorage,
    restoreFromBackup,
    migrateLocalStorageToSupabase,
    STORAGE_KEYS,
    resetEncryptionStateForTests,
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

vi.mock('../../config/env', () => ({
    VITE_ENCRYPTION_KEY: 'a'.repeat(32),
}));

const ENCRYPTION_KEY = 'a'.repeat(32);

const encryptStoredArray = (value: unknown[]): string => AES.encrypt(JSON.stringify(value), ENCRYPTION_KEY).toString();
const decryptStoredArray = <T>(cipher: string): T[] =>
    JSON.parse(AES.decrypt(cipher, ENCRYPTION_KEY).toString(Utf8)) as T[];
const seedEncryptedLocalStorage = <T>(key: string, value: T[]): void => {
    localStorage.setItem(key, encryptStoredArray(value));
};
const readEncryptedLocalStorage = <T>(key: string): T[] => {
    const cipher = localStorage.getItem(key);
    return cipher ? decryptStoredArray<T>(cipher) : [];
};

// Mock Dependencies
vi.mock('../supabaseService');
vi.mock('../../config/supabase');
vi.mock('../../utils/logger');

const createSupabaseClientMock = (
    overrides: {
        data?: unknown[];
        error?: { message: string; code: string; details?: unknown } | null;
    } = {}
) => {
    const builder: unknown = {
        select: vi.fn(() => builder),
        is: vi.fn(() => builder),
        order: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        range: vi.fn(async () => ({
            data: overrides.data ?? null,
            error: overrides.error ?? null,
            count: Array.isArray(overrides.data) ? overrides.data.length : null,
        })),
    };

    return {
        auth: {
            getUser: vi.fn(async () => ({
                data: { user: { id: 'test-user' } },
                error: null,
            })),
        },
        from: vi.fn(() => builder),
    } as unknown as ReturnType<typeof SupabaseConfig.getSupabaseClient>;
};

describe('StorageAdapter', () => {
    // Manual in-memory store for the mock
    let store: Record<string, string> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        resetEncryptionStateForTests();
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

    it('encrypts local payloads before persisting', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        await StorageAdapter.addClient(MOCK_CLIENT_1);

        const stored = readEncryptedLocalStorage(STORAGE_KEYS.CLIENTS);
        expect(stored).toHaveLength(1);
        expect(stored[0]).toEqual(expect.objectContaining({ name: MOCK_CLIENT_1.name }));
    });

    it('clears storage when decryption fails', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        localStorage.setItem(STORAGE_KEYS.CLIENTS, 'invalid-cipher');

        const { data } = await StorageAdapter.getClients();

        expect(data).toEqual([]);
        expect(localStorage.clear).toHaveBeenCalled();
    });

    it('should save data to localStorage correctly', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);

        await StorageAdapter.addClient(MOCK_CLIENT_1);

        expect(localStorage.setItem).toHaveBeenCalled();
        const { data } = await StorageAdapter.getClients();
        expect(data).toHaveLength(1);
        const client = data[0];
        expect(client).toBeDefined();
        expect(client!.name).toBe(MOCK_CLIENT_1.name);
    });

    it('should backup all local data', () => {
        seedEncryptedLocalStorage(STORAGE_KEYS.CLIENTS, MOCK_CLIENTS);
        seedEncryptedLocalStorage(STORAGE_KEYS.RESERVATIONS, MOCK_RESERVATIONS);
        seedEncryptedLocalStorage(STORAGE_KEYS.TRANSACTIONS, []);

        const backup = backupLocalStorage();

        expect(backup.clients).toHaveLength(MOCK_CLIENTS.length);
        expect(backup.reservations).toHaveLength(MOCK_RESERVATIONS.length);
    });

    it('should return empty list when localStorage read fails', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const getItemMock = localStorage.getItem as unknown as Mock;
        getItemMock.mockImplementationOnce(() => { throw new Error('read fail'); });

        const { data } = await StorageAdapter.getClients();

        expect(data).toEqual([]);
    });

    it('returns paginated clients when Supabase supplies data', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        const supabaseClient = createSupabaseClientMock({ data: MOCK_CLIENTS });
        vi.mocked(SupabaseConfig.getSupabaseClient).mockReturnValue(supabaseClient as unknown);

        const { data } = await StorageAdapter.getClients();

        expect(data).toEqual(MOCK_CLIENTS);
        expect(supabaseClient.from).toHaveBeenCalledWith('clients');
    });

    it('falls back to local clients when Supabase paginated query fails', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        const supabaseClient = createSupabaseClientMock({
            error: { message: 'network', code: '500', details: null },
        });
        vi.mocked(SupabaseConfig.getSupabaseClient).mockReturnValue(supabaseClient as unknown);
        seedEncryptedLocalStorage(STORAGE_KEYS.CLIENTS, MOCK_CLIENTS);

        const { data } = await StorageAdapter.getClients();

        expect(data).toEqual(MOCK_CLIENTS);
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
        const { data: stored } = await StorageAdapter.getReservations();
        expect(stored).toHaveLength(1);
    });

    it('should update reservation status locally when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const reservation = { ...MOCK_RESERVATION_1 };
        seedEncryptedLocalStorage(STORAGE_KEYS.RESERVATIONS, [reservation]);

        await StorageAdapter.updateReservationStatus(reservation.id, ReservationStatus.CANCELLED);

        const [updatedReservation] = readEncryptedLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        expect(updatedReservation).toBeDefined();
        expect(updatedReservation!.status).toBe(ReservationStatus.CANCELLED);
    });

    it('should archive reservations locally when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const reservation = { ...MOCK_RESERVATION_1, isArchived: false };
        seedEncryptedLocalStorage(STORAGE_KEYS.RESERVATIONS, [reservation]);

        await StorageAdapter.archiveReservation(reservation.id);

        const [archivedReservation] = readEncryptedLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        expect(archivedReservation).toBeDefined();
        expect(archivedReservation!.isArchived).toBe(true);
    });

    it('should delete reservations locally when Supabase is disabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(false);
        const reservation = { ...MOCK_RESERVATION_1 };
        seedEncryptedLocalStorage(STORAGE_KEYS.RESERVATIONS, [reservation]);

        await StorageAdapter.deleteReservation(reservation.id);

        const storedReservations = readEncryptedLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        expect(storedReservations).toHaveLength(0);
    });

    it('should delegate deleteClient to Supabase when enabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.deleteClient).mockResolvedValue(undefined);

        await StorageAdapter.deleteClient(MOCK_CLIENT_1.id);

        expect(SupabaseService.deleteClient).toHaveBeenCalledWith(MOCK_CLIENT_1.id);
    });

    it('returns paginated reservations when Supabase supplies data', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        const supabaseClient = createSupabaseClientMock({ data: MOCK_RESERVATIONS });
        vi.mocked(SupabaseConfig.getSupabaseClient).mockReturnValue(supabaseClient as unknown);

        const { data } = await StorageAdapter.getReservations();

        expect(data).toEqual(MOCK_RESERVATIONS);
        expect(supabaseClient.from).toHaveBeenCalledWith('reservations');
    });

    it('falls back to local reservations when Supabase paginated query fails', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        const supabaseClient = createSupabaseClientMock({
            error: { message: 'fail', code: '500', details: null },
        });
        vi.mocked(SupabaseConfig.getSupabaseClient).mockReturnValue(supabaseClient as unknown);
        seedEncryptedLocalStorage(STORAGE_KEYS.RESERVATIONS, MOCK_RESERVATIONS);

        const { data } = await StorageAdapter.getReservations();

        expect(data).toEqual(MOCK_RESERVATIONS);
    });

    it('should update reservation status through Supabase when enabled', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        vi.mocked(SupabaseService.updateReservationStatus).mockResolvedValue(undefined);

        await StorageAdapter.updateReservationStatus('res-1', ReservationStatus.CONFIRMED);

        expect(SupabaseService.updateReservationStatus).toHaveBeenCalledWith('res-1', ReservationStatus.CONFIRMED);
    });

    it('returns paginated transactions when Supabase supplies data', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        const supabaseClient = createSupabaseClientMock({ data: MOCK_TRANSACTIONS });
        vi.mocked(SupabaseConfig.getSupabaseClient).mockReturnValue(supabaseClient as unknown);

        const { data } = await StorageAdapter.getTransactions();

        expect(data).toEqual(MOCK_TRANSACTIONS);
        expect(supabaseClient.from).toHaveBeenCalledWith('transactions');
    });

    it('falls back to local transactions when Supabase paginated query fails', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        const supabaseClient = createSupabaseClientMock({
            error: { message: 'nope', code: '501', details: null },
        });
        vi.mocked(SupabaseConfig.getSupabaseClient).mockReturnValue(supabaseClient as unknown);
        seedEncryptedLocalStorage(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);

        const { data } = await StorageAdapter.getTransactions();

        expect(data).toEqual(MOCK_TRANSACTIONS);
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
        const stored = readEncryptedLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        expect(stored).toHaveLength(0);
    });

    it('should migrate localStorage data to Supabase', async () => {
        vi.mocked(SupabaseConfig.isSupabaseEnabled).mockReturnValue(true);
        seedEncryptedLocalStorage(STORAGE_KEYS.CLIENTS, MOCK_CLIENTS);
        seedEncryptedLocalStorage(STORAGE_KEYS.RESERVATIONS, MOCK_RESERVATIONS);
        seedEncryptedLocalStorage(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);

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
        seedEncryptedLocalStorage(STORAGE_KEYS.CLIENTS, MOCK_CLIENTS.slice(0, 1));
        seedEncryptedLocalStorage(STORAGE_KEYS.RESERVATIONS, MOCK_RESERVATIONS.slice(0, 1));
        seedEncryptedLocalStorage(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS.slice(0, 1));

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

        expect(localStorage.setItem).toHaveBeenCalledTimes(3);
        expect(readEncryptedLocalStorage(STORAGE_KEYS.CLIENTS)).toEqual(MOCK_CLIENTS);
        expect(readEncryptedLocalStorage(STORAGE_KEYS.RESERVATIONS)).toEqual(MOCK_RESERVATIONS);
        expect(readEncryptedLocalStorage(STORAGE_KEYS.TRANSACTIONS)).toEqual(MOCK_TRANSACTIONS);
    });
});
