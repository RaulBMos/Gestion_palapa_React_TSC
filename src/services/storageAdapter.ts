/**
 * Storage Adapter
 * Provides a unified interface to switch between localStorage and Supabase
 * Allows gradual migration and fallback strategy
 */

import type {
    Client,
    Reservation,
    Transaction,
    ReservationStatus,
} from '../types';
import { isSupabaseEnabled, getSupabaseClient } from '../config/supabase';
import * as SupabaseService from './supabaseService';
import { logError, logInfo, logWarning } from '../utils/logger';
import { VITE_ENCRYPTION_KEY } from '../config/env';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

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
let decryptionEscalated = false;

const encryptPayload = (payload: string): string => {
    if (!isEncryptionEnabled) {
        return payload;
    }

    return AES.encrypt(payload, encryptionKey).toString();
};

const decryptPayload = (cipherText: string): string => {
    if (!isEncryptionEnabled) {
        return cipherText;
    }

    const bytes = AES.decrypt(cipherText, encryptionKey);
    const decrypted = bytes.toString(Utf8);
    if (!decrypted) {
        throw new Error('Stored data could not be decrypted');
    }

    return decrypted;
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

        const decryptedText = decryptPayload(data);
        return JSON.parse(decryptedText);
    } catch (error) {
        logWarning(`Failed to read from localStorage: ${key}`, { error });
        handleDecryptionFailure(error);
        return [];
    }
}

function saveToLocalStorage<T>(key: string, data: T[]): void {
    try {
        const payload = JSON.stringify(data);
        const encrypted = encryptPayload(payload);
        localStorage.setItem(key, encrypted);
    } catch (error) {
        logWarning(`Failed to save to localStorage: ${key}`, { error });
    }
}

// =============================================================================
// UNIFIED STORAGE ADAPTER
// =============================================================================

/**
 * Storage interface that works with both localStorage and Supabase
 */
export const StorageAdapter = {
    // ========== CLIENTS ==========

    async getClients(): Promise<Client[]> {
        if (isSupabaseEnabled()) {
            try {
                return await SupabaseService.fetchClients();
            } catch (error) {
                logWarning('Failed to fetch clients from Supabase, falling back to localStorage', { error });
                return getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS);
            }
        }
        return getFromLocalStorage<Client>(STORAGE_KEYS.CLIENTS);
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

    async getReservations(): Promise<Reservation[]> {
        if (isSupabaseEnabled()) {
            try {
                return await SupabaseService.fetchReservations();
            } catch (error) {
                logWarning('Failed to fetch reservations from Supabase, falling back to localStorage', { error });
                return getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
            }
        }
        return getFromLocalStorage<Reservation>(STORAGE_KEYS.RESERVATIONS);
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

    async getTransactions(): Promise<Transaction[]> {
        if (isSupabaseEnabled()) {
            try {
                return await SupabaseService.fetchTransactions();
            } catch (error) {
                logWarning('Failed to fetch transactions from Supabase, falling back to localStorage', { error });
                return getFromLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
            }
        }
        return getFromLocalStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
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
