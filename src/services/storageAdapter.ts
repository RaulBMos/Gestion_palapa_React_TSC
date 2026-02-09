/**
 * Storage Adapter
 * Provides a unified interface to switch between localStorage and Supabase
 * Allows gradual migration and fallback strategy
 */

import type {
    Client,
    PaginatedResponse,
    PaymentMethod,
    Reservation,
    ReservationStatus,
    Transaction,
    TransactionType,
} from '../types';
import { isSupabaseEnabled, getSupabaseClient } from '../config/supabase';
import * as SupabaseService from './supabaseService';
import { logError, logInfo, logWarning } from '../utils/logger';
import { SecurityLogger } from '../utils/securityLogger';
import {
    VITE_ENCRYPTION_KEY,
    VITE_ENCRYPTION_KEY_HISTORY,
    VITE_ENCRYPTION_KEY_VERSION,
} from '../config/env';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import type { DbClient, DbReservation, DbTransaction } from '../types/supabase.types';

/**
 * LocalStorage keys (exported for testing)
 */
export const STORAGE_KEYS = {
    CLIENTS: 'cg_clients',
    RESERVATIONS: 'cg_reservations',
    TRANSACTIONS: 'cg_transactions',
} as const;

const encryptionKey = VITE_ENCRYPTION_KEY;
const isEncryptionEnabled = typeof encryptionKey === 'string' && encryptionKey.length > 0;
const currentEncryptionVersion = isEncryptionEnabled
    ? Math.max(Number(VITE_ENCRYPTION_KEY_VERSION ?? 1), 1)
    : 0;
let decryptionEscalated = false;

type WrappedPayload = {
    v: number;
    d: string;
    t: string;
};

class ObsoleteEncryptionError extends Error {
    constructor(public readonly version: number) {
        super(`No encryption key available for version ${version}`);
        this.name = 'ObsoleteEncryptionError';
    }
}

const parseEncryptionHistory = (raw?: string): Record<number, string> => {
    if (!raw) {
        return {};
    }

    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('Encryption history must be an object');
        }

        return Object.entries(parsed).reduce<Record<number, string>>((carry, [version, key]) => {
            const versionNumber = Number(version);
            if (!Number.isFinite(versionNumber) || versionNumber <= 0 || typeof key !== 'string') {
                return carry;
            }

            carry[versionNumber] = key;
            return carry;
        }, {});
    } catch (error) {
        logWarning('Invalid encryption key history; ignoring legacy versions', { error });
        SecurityLogger.alert('Invalid encryption key history payload', { error });
        return {};
    }
};

const encryptionKeyHistory = parseEncryptionHistory(VITE_ENCRYPTION_KEY_HISTORY);
const encryptionRegistry = new Map<number, string>();

if (isEncryptionEnabled && encryptionKey) {
    encryptionRegistry.set(currentEncryptionVersion, encryptionKey);
}

Object.entries(encryptionKeyHistory).forEach(([version, key]) => {
    const parsedVersion = Number(version);
    if (Number.isFinite(parsedVersion) && parsedVersion > 0) {
        encryptionRegistry.set(parsedVersion, key);
    }
});

const getKeyForVersion = (version: number): string | undefined => encryptionRegistry.get(version);

const decryptWithKey = (cipherText: string, key: string, version: number): string => {
    const bytes = AES.decrypt(cipherText, key);
    const decrypted = bytes.toString(Utf8);
    if (!decrypted) {
        SecurityLogger.alert('Encrypted data integrity validation failed', { version });
        throw new Error('Stored data could not be decrypted');
    }

    return decrypted;
};

const wrapData = (payload: string): string => {
    const timestamp = new Date().toISOString();
    if (currentEncryptionVersion === 0) {
        return JSON.stringify({ v: 0, d: payload, t: timestamp });
    }

    const key = getKeyForVersion(currentEncryptionVersion);
    if (!key) {
        logWarning('Encryption key for current version is missing; storing plaintext payload', {
            version: currentEncryptionVersion,
        });
        SecurityLogger.alert('Missing encryption key for storage rotation', {
            version: currentEncryptionVersion,
        });
        return JSON.stringify({ v: 0, d: payload, t: timestamp });
    }

    const cipher = AES.encrypt(payload, key).toString();
    return JSON.stringify({ v: currentEncryptionVersion, d: cipher, t: timestamp });
};

const unwrapData = (raw: string): { value: string; needsUpgrade: boolean } => {
    let payload: WrappedPayload;
    try {
        payload = JSON.parse(raw);
    } catch (error) {
        SecurityLogger.alert('Encrypted payload parsing failed', { raw, error });
        throw error;
    }

    if (!payload || typeof payload !== 'object' || typeof payload.d !== 'string') {
        SecurityLogger.alert('Encrypted payload structure invalid', { payload });
        throw new Error('Invalid encrypted payload');
    }

    const version = typeof payload.v === 'number' ? payload.v : 0;
    if (version === 0) {
        return { value: payload.d, needsUpgrade: false };
    }

    const key = getKeyForVersion(version);
    if (!key) {
        SecurityLogger.alert('Unknown encryption version detected during read', { version, timestamp: payload.t });
        throw new ObsoleteEncryptionError(version);
    }

    const decrypted = decryptWithKey(payload.d, key, version);
    return { value: decrypted, needsUpgrade: version !== currentEncryptionVersion };
};

const clearSensitiveStorage = (): void => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    window.localStorage.clear();
};

const reloadApp = (): void => {
    if (typeof window === 'undefined') {
        return;
    }

    window.location.reload();
};

const forceLogout = async (): Promise<void> => {
    try {
        if (isSupabaseEnabled()) {
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();
        }
    } catch (error) {
        logWarning('Failed to sign out during encryption failure cleanup', { error });
    } finally {
        reloadApp();
    }
};

const handleDecryptionFailure = (error: unknown): void => {
    if (decryptionEscalated) {
        return;
    }

    decryptionEscalated = true;
    logError(error instanceof Error ? error : new Error('Failed to decrypt persisted data'), {
        component: 'storageAdapter',
        action: 'handleDecryptionFailure',
    });
    clearSensitiveStorage();
    void forceLogout();
};

// =============================================================================
// LOCALSTORAGE IMPLEMENTATION
// =============================================================================

/**
 * Get data from localStorage
 */
function getFromLocalStorage<T>(key: string): T[] {
    try {
        const data = localStorage.getItem(key);
        if (!data) {
            return [];
        }

        const { value, needsUpgrade } = unwrapData(data);
        const parsed = JSON.parse(value) as T[];

        if (needsUpgrade) {
            logInfo('Re-encrypting localStorage payload to the latest encryption version', {
                key,
                version: currentEncryptionVersion,
            });
            localStorage.setItem(key, wrapData(value));
        }

        return parsed;
    } catch (error) {
        if (error instanceof ObsoleteEncryptionError) {
            logWarning(`Removing obsolete payload for ${key}`, { version: error.version });
            localStorage.removeItem(key);
            return [];
        }

        logWarning(`Failed to read from localStorage: ${key}`, { error });
        handleDecryptionFailure(error);
        return [];
    }
}

function saveToLocalStorage<T>(key: string, data: T[]): void {
    try {
        const payload = JSON.stringify(data);
        const wrapped = wrapData(payload);
        localStorage.setItem(key, wrapped);
    } catch (error) {
        logWarning(`Failed to save to localStorage: ${key}`, { error });
    }
}

type FilterValue = string | number | boolean | null | undefined;

export interface PaginationOptions {
    page?: number;
    limit?: number;
    filters?: Record<string, FilterValue>;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

const toCamelCase = (value: string): string =>
    value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const toSnakeCase = (value: string): string =>
    value.replace(/([A-Z])/g, (_, letter) => `_${letter.toLowerCase()}`);

const applyFiltersToArray = <T>(
    items: T[],
    filters?: Record<string, FilterValue>
): T[] => {
    if (!filters) {
        return items;
    }

    return items.filter((item) =>
        Object.entries(filters).every(([key, value]) => {
            if (value === undefined) {
                return true;
            }

            const field = toCamelCase(key);
            const record = item as unknown as Record<string, unknown>;
            const current = record[field];
            return current === value;
        })
    );
};

const normalizePagination = (options?: PaginationOptions) => {
    const page = Math.max(options?.page ?? DEFAULT_PAGE, 1);
    const limit = Math.max(options?.limit ?? DEFAULT_LIMIT, 1);
    return {
        page,
        limit,
        filters: options?.filters,
    };
};

const ensureSupabaseUser = async (mandatory = false): Promise<string | null> => {
    const supabase = getSupabaseClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        if (mandatory) {
            throw new SupabaseService.SupabaseError('No authenticated user found', 'AUTH_ERROR');
        }

        logInfo('No authenticated user found while querying Supabase (paginated)', {
            component: 'storageAdapter',
            action: 'ensureSupabaseUser',
        });
        return null;
    }

    return user.id;
};

const calculateRange = (page: number, limit: number) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
};

const mapDbClientToClient = (client: DbClient): Client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    notes: client.notes ?? undefined,
});

const mapDbReservationToReservation = (row: DbReservation): Reservation => ({
    id: row.id,
    clientId: row.client_id,
    cabinCount: row.cabin_count,
    startDate: row.start_date,
    endDate: row.end_date,
    adults: row.adults,
    children: row.children,
    totalAmount: row.total_amount,
    status: row.status as ReservationStatus,
    isArchived: row.is_archived || undefined,
});

const mapDbTransactionToTransaction = (row: DbTransaction): Transaction => ({
    id: row.id,
    date: row.date,
    amount: row.amount,
    type: row.type as TransactionType,
    category: row.category,
    description: row.description,
    paymentMethod: row.payment_method as PaymentMethod,
    reservationId: row.reservation_id || undefined,
});

// =============================================================================
// UNIFIED STORAGE ADAPTER
// =============================================================================

/**
 * Storage interface that works with both localStorage and Supabase
 */
export const StorageAdapter = {
    // ========== CLIENTS ==========

    async getClients(options?: PaginationOptions): Promise<PaginatedResponse<Client>> {
        const { page, limit, filters } = normalizePagination(options);
        const { from, to } = calculateRange(page, limit);
        const rangeLabel = `${from}-${to}`;
        const context = {
            component: 'storageAdapter',
            table: 'clients',
            range: rangeLabel,
            page,
            limit,
        };

        if (isSupabaseEnabled()) {
            try {
                await ensureSupabaseUser(true);
                const supabase = getSupabaseClient();

                let query: any = supabase
                    .from('clients')
                    .select('*', { count: 'exact' })
                    .is('deleted_at', null)
                    .order('name', { ascending: true });

                if (filters) {
                    Object.entries(filters).forEach(([key, value]) => {
                        if (value === undefined) {
                            return;
                        }
                        query = query.eq(toSnakeCase(key), value as FilterValue);
                    });
                }

                const paged = await query.range(from, to);
                const { data, error, count } = paged;
                const rows = (data ?? []) as DbClient[];

                if (error) {
                    throw new SupabaseService.SupabaseError(error.message, error.code, error.details);
                }

                const payload = rows.map(mapDbClientToClient);
                logInfo('Paginated clients fetched from Supabase', {
                    ...context,
                    source: 'supabase',
                    count: count ?? null,
                });
                return {
                    data: payload,
                    count: count ?? null,
                };
            } catch (error) {
                logWarning('Failed to fetch paginated clients from Supabase, falling back to localStorage', {
                    ...context,
                    error,
                });
            }
        }

        const stored = getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS);
        const filtered = applyFiltersToArray(stored, filters);
        const paginated = filtered.slice(from, to + 1);
        logInfo('Paginated clients served from localStorage', {
            ...context,
            source: 'localStorage',
            count: filtered.length,
        });
        return {
            data: paginated,
            count: filtered.length,
        };
    },

    async addClient(client: Omit<Client, 'id'>): Promise<Client> {
        if (isSupabaseEnabled()) {
            return await SupabaseService.createClient(client);
        }

        // LocalStorage implementation
        const newClient: Client = {
            ...client,
            id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        const clients = getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS);
        clients.push(newClient);
        saveToLocalStorage(STORAGE_KEYS.CLIENTS, clients);
        return newClient;
    },

    async updateClient(updatedClient: Client): Promise<Client> {
        if (isSupabaseEnabled()) {
            return await SupabaseService.updateClient(updatedClient);
        }

        // LocalStorage implementation
        const clients = getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS);
        const index = clients.findIndex((c) => c.id === updatedClient.id);
        if (index !== -1) {
            clients[index] = updatedClient;
            saveToLocalStorage(STORAGE_KEYS.CLIENTS, clients);
        }
        return updatedClient;
    },

    async deleteClient(id: string): Promise<void> {
        if (isSupabaseEnabled()) {
            await SupabaseService.deleteClient(id);
            return;
        }

        // LocalStorage implementation
        const clients = getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS);
        const filtered = clients.filter((c) => c.id !== id);
        saveToLocalStorage(STORAGE_KEYS.CLIENTS, filtered);
    },

    // ========== RESERVATIONS ==========

    async getReservations(options?: PaginationOptions): Promise<PaginatedResponse<Reservation>> {
        const { page, limit, filters } = normalizePagination(options);
        const { from, to } = calculateRange(page, limit);
        const rangeLabel = `${from}-${to}`;
        const context = {
            component: 'storageAdapter',
            table: 'reservations',
            range: rangeLabel,
            page,
            limit,
        };

        if (isSupabaseEnabled()) {
            try {
                await ensureSupabaseUser(true);
                const supabase = getSupabaseClient();

                let query: any = supabase
                    .from('reservations')
                    .select('*', { count: 'exact' })
                    .is('deleted_at', null)
                    .order('start_date', { ascending: false });

                if (filters) {
                    Object.entries(filters).forEach(([key, value]) => {
                        if (value === undefined) {
                            return;
                        }
                        query = query.eq(toSnakeCase(key), value as FilterValue);
                    });
                }

                const paged = await query.range(from, to);
                const { data, error, count } = paged;
                const rows = (data ?? []) as DbReservation[];

                if (error) {
                    throw new SupabaseService.SupabaseError(error.message, error.code, error.details);
                }

                const payload = rows.map(mapDbReservationToReservation);
                logInfo('Paginated reservations fetched from Supabase', {
                    ...context,
                    source: 'supabase',
                    count: count ?? null,
                });
                return {
                    data: payload,
                    count: count ?? null,
                };
            } catch (error) {
                logWarning('Failed to fetch paginated reservations from Supabase, falling back to localStorage', {
                    ...context,
                    error,
                });
            }
        }

        const stored = getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        const filtered = applyFiltersToArray(stored, filters);
        const paginated = filtered.slice(from, to + 1);
        logInfo('Paginated reservations served from localStorage', {
            ...context,
            source: 'localStorage',
            count: filtered.length,
        });
        return {
            data: paginated,
            count: filtered.length,
        };
    },

    async addReservation(reservation: Omit<Reservation, 'id'>): Promise<Reservation> {
        if (isSupabaseEnabled()) {
            return await SupabaseService.createReservation(reservation);
        }

        // LocalStorage implementation
        const newReservation: Reservation = {
            ...reservation,
            id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        const reservations = getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        reservations.push(newReservation);
        saveToLocalStorage(STORAGE_KEYS.RESERVATIONS, reservations);
        return newReservation;
    },

    async updateReservation(updatedReservation: Reservation): Promise<Reservation> {
        if (isSupabaseEnabled()) {
            return await SupabaseService.updateReservation(updatedReservation);
        }

        // LocalStorage implementation
        const reservations = getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        const index = reservations.findIndex((r) => r.id === updatedReservation.id);
        if (index !== -1) {
            reservations[index] = updatedReservation;
            saveToLocalStorage(STORAGE_KEYS.RESERVATIONS, reservations);
        }
        return updatedReservation;
    },

    async updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
        if (isSupabaseEnabled()) {
            await SupabaseService.updateReservationStatus(id, status);
            return;
        }

        // LocalStorage implementation
        const reservations = getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        const reservation = reservations.find((r) => r.id === id);
        if (reservation) {
            reservation.status = status;
            saveToLocalStorage(STORAGE_KEYS.RESERVATIONS, reservations);
        }
    },

    async archiveReservation(id: string): Promise<void> {
        if (isSupabaseEnabled()) {
            await SupabaseService.archiveReservation(id);
            return;
        }

        // LocalStorage implementation
        const reservations = getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        const reservation = reservations.find((r) => r.id === id);
        if (reservation) {
            reservation.isArchived = true;
            saveToLocalStorage(STORAGE_KEYS.RESERVATIONS, reservations);
        }
    },

    async deleteReservation(id: string): Promise<void> {
        if (isSupabaseEnabled()) {
            await SupabaseService.deleteReservation(id);
            return;
        }

        // LocalStorage implementation
        const reservations = getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        const filtered = reservations.filter((r) => r.id !== id);
        saveToLocalStorage(STORAGE_KEYS.RESERVATIONS, filtered);
    },

    // ========== TRANSACTIONS ==========

    async getTransactions(options?: PaginationOptions): Promise<PaginatedResponse<Transaction>> {
        const { page, limit, filters } = normalizePagination(options);
        const { from, to } = calculateRange(page, limit);
        const rangeLabel = `${from}-${to}`;
        const context = {
            component: 'storageAdapter',
            table: 'transactions',
            range: rangeLabel,
            page,
            limit,
        };

        if (isSupabaseEnabled()) {
            try {
                await ensureSupabaseUser(true);
                const supabase = getSupabaseClient();

                let query: any = supabase
                    .from('transactions')
                    .select('*', { count: 'exact' })
                    .is('deleted_at', null)
                    .order('date', { ascending: false });

                if (filters) {
                    Object.entries(filters).forEach(([key, value]) => {
                        if (value === undefined) {
                            return;
                        }
                        query = query.eq(toSnakeCase(key), value as FilterValue);
                    });
                }

                const paged = await query.range(from, to);
                const { data, error, count } = paged;
                const rows = (data ?? []) as DbTransaction[];

                if (error) {
                    throw new SupabaseService.SupabaseError(error.message, error.code, error.details);
                }

                const payload = rows.map(mapDbTransactionToTransaction);
                logInfo('Paginated transactions fetched from Supabase', {
                    ...context,
                    source: 'supabase',
                    count: count ?? null,
                });
                return {
                    data: payload,
                    count: count ?? null,
                };
            } catch (error) {
                logWarning('Failed to fetch paginated transactions from Supabase, falling back to localStorage', {
                    ...context,
                    error,
                });
            }
        }

        const stored = getFromLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        const filtered = applyFiltersToArray(stored, filters);
        const paginated = filtered.slice(from, to + 1);
        logInfo('Paginated transactions served from localStorage', {
            ...context,
            source: 'localStorage',
            count: filtered.length,
        });
        return {
            data: paginated,
            count: filtered.length,
        };
    },

    async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
        if (isSupabaseEnabled()) {
            return await SupabaseService.createTransaction(transaction);
        }

        // LocalStorage implementation
        const newTransaction: Transaction = {
            ...transaction,
            id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        const transactions = getFromLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        transactions.push(newTransaction);
        saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
        return newTransaction;
    },

    async updateTransaction(updatedTransaction: Transaction): Promise<Transaction> {
        if (isSupabaseEnabled()) {
            return await SupabaseService.updateTransaction(updatedTransaction);
        }

        // LocalStorage implementation
        const transactions = getFromLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        const index = transactions.findIndex((t) => t.id === updatedTransaction.id);
        if (index !== -1) {
            transactions[index] = updatedTransaction;
            saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
        }
        return updatedTransaction;
    },

    async deleteTransaction(id: string): Promise<void> {
        if (isSupabaseEnabled()) {
            await SupabaseService.deleteTransaction(id);
            return;
        }

        // LocalStorage implementation
        const transactions = getFromLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        const filtered = transactions.filter((t) => t.id !== id);
        saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, filtered);
    },
};

// =============================================================================
// MIGRATION UTILITIES
// =============================================================================

/**
 * Migrate data from localStorage to Supabase
 * This is a one-time operation to move existing data to the cloud
 */
export async function migrateLocalStorageToSupabase(): Promise<{
    success: boolean;
    migrated: { clients: number; reservations: number; transactions: number };
    errors: string[];
}> {
    if (!isSupabaseEnabled()) {
        return {
            success: false,
            migrated: { clients: 0, reservations: 0, transactions: 0 },
            errors: ['Supabase is not enabled'],
        };
    }

    const errors: string[] = [];
    const migrated = { clients: 0, reservations: 0, transactions: 0 };

    try {
        logInfo('Starting migration from localStorage to Supabase');

        // Migrate clients
        const localClients = getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS);
        for (const client of localClients) {
            try {
                const { id: _unusedClientId, ...clientData } = client;
                void _unusedClientId;
                await SupabaseService.createClient(clientData);
                migrated.clients++;
            } catch (error) {
                errors.push(`Failed to migrate client ${client.id}: ${error}`);
            }
        }

        // Migrate reservations
        const localReservations = getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
        for (const reservation of localReservations) {
            try {
                const { id: _unusedReservationId, ...reservationData } = reservation;
                void _unusedReservationId;
                await SupabaseService.createReservation(reservationData);
                migrated.reservations++;
            } catch (error) {
                errors.push(`Failed to migrate reservation ${reservation.id}: ${error}`);
            }
        }

        // Migrate transactions
        const localTransactions = getFromLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        for (const transaction of localTransactions) {
            try {
                const { id: _unusedTransactionId, ...transactionData } = transaction;
                void _unusedTransactionId;
                await SupabaseService.createTransaction(transactionData);
                migrated.transactions++;
            } catch (error) {
                errors.push(`Failed to migrate transaction ${transaction.id}: ${error}`);
            }
        }

        logInfo('Migration completed', { migrated, errorCount: errors.length });

        return {
            success: errors.length === 0,
            migrated,
            errors,
        };
    } catch (error) {
        errors.push(`Migration failed: ${error}`);
        return {
            success: false,
            migrated,
            errors,
        };
    }
}

/**
 * Create a backup of localStorage data
 */
export function backupLocalStorage(): {
    clients: Client[];
    reservations: Reservation[];
    transactions: Transaction[];
    timestamp: string;
} {
    return {
        clients: getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS),
        reservations: getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS),
        transactions: getFromLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS),
        timestamp: new Date().toISOString(),
    };
}

/**
 * Restore data from backup
 */
export function restoreFromBackup(backup: {
    clients: Client[];
    reservations: Reservation[];
    transactions: Transaction[];
}): void {
    saveToLocalStorage(STORAGE_KEYS.CLIENTS, backup.clients);
    saveToLocalStorage(STORAGE_KEYS.RESERVATIONS, backup.reservations);
    saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, backup.transactions);
    logInfo('Data restored from backup');
}

export function resetEncryptionStateForTests(): void {
    decryptionEscalated = false;
}
