/**
 * Supabase Data Service
 * Handles all CRUD operations for Clients, Reservations, and Transactions
 * Implements retry logic, error handling, and type safety
 */

import { getSupabaseClient } from '../config/supabase';
import type {
    Client,
    Reservation,
    Transaction,
    ReservationStatus,
} from '../types';
import type {
    DbClient,
    DbReservation,
    DbTransaction,
    InsertClient,
    InsertReservation,
    InsertTransaction,
    UpdateClient,
    UpdateReservation,
    UpdateTransaction,
} from '../types/supabase.types';
import { logError, logInfo } from '../utils/logger';
import { withRetry, type RetryOptions } from '../utils/retry';

/**
 * Custom error class for Supabase operations
 */
export class SupabaseError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'SupabaseError';
    }
}

/**
 * Retry configuration for database operations
 */
const DB_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
    retryCondition: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
        return errorMessage.includes('network') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('connection');
    },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Maps database client to application client type
 */
function mapDbClientToClient(dbClient: DbClient): Client {
    return {
        id: dbClient.id,
        name: dbClient.name,
        email: dbClient.email,
        phone: dbClient.phone,
        notes: dbClient.notes || undefined,
    };
}

/**
 * Maps database reservation to application reservation type
 */
function mapDbReservationToReservation(dbReservation: DbReservation): Reservation {
    return {
        id: dbReservation.id,
        clientId: dbReservation.client_id,
        cabinCount: dbReservation.cabin_count,
        startDate: dbReservation.start_date,
        endDate: dbReservation.end_date,
        adults: dbReservation.adults,
        children: dbReservation.children,
        totalAmount: dbReservation.total_amount,
        status: dbReservation.status as ReservationStatus,
        isArchived: dbReservation.is_archived || undefined,
    };
}

/**
 * Maps database transaction to application transaction type
 */
function mapDbTransactionToTransaction(dbTransaction: DbTransaction): Transaction {
    return {
        id: dbTransaction.id,
        date: dbTransaction.date,
        amount: dbTransaction.amount,
        type: dbTransaction.type as Transaction['type'],
        category: dbTransaction.category,
        description: dbTransaction.description,
        paymentMethod: dbTransaction.payment_method as Transaction['paymentMethod'],
        reservationId: dbTransaction.reservation_id || undefined,
    };
}

/**
 * Get current user ID from Supabase auth
 */
async function getUserId(): Promise<string> {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new SupabaseError('No authenticated user found', 'AUTH_ERROR');
    }

    return user.id;
}

// =============================================================================
// CLIENTS SERVICE
// =============================================================================

/**
 * Fetch all clients for the current user
 */
export async function fetchClients(): Promise<Client[]> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();
        await getUserId(); // Ensure session exists before querying

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .is('deleted_at', null)
            .order('name', { ascending: true });

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return data.map(mapDbClientToClient);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to fetch clients'), {
            component: 'SupabaseService',
            action: 'fetchClients',
        });
        throw result.error || new SupabaseError('Failed to fetch clients', 'FETCH_ERROR');
    }

    logInfo(`Fetched ${result.data.length} clients from Supabase`);
    return result.data;
}

/**
 * Create a new client
 */
export async function createClient(client: Omit<Client, 'id'>): Promise<Client> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();
        const userId = await getUserId();

        const insertData: InsertClient = {
            name: client.name,
            email: client.email,
            phone: client.phone,
            notes: client.notes || null,
            user_id: userId,
        };

        const { data, error } = await supabase
            .from('clients')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return mapDbClientToClient(data);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to create client'), {
            component: 'SupabaseService',
            action: 'createClient',
            client,
        });
        throw result.error || new SupabaseError('Failed to create client', 'CREATE_ERROR');
    }

    logInfo('Client created successfully', { clientId: result.data.id });
    return result.data;
}

/**
 * Update an existing client
 */
export async function updateClient(client: Client): Promise<Client> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const updateData: UpdateClient = {
            name: client.name,
            email: client.email,
            phone: client.phone,
            notes: client.notes || null,
        };

        const { data, error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', client.id)
            .select()
            .single();

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return mapDbClientToClient(data);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to update client'), {
            component: 'SupabaseService',
            action: 'updateClient',
            clientId: client.id,
        });
        throw result.error || new SupabaseError('Failed to update client', 'UPDATE_ERROR');
    }

    logInfo('Client updated successfully', { clientId: result.data.id });
    return result.data;
}

/**
 * Soft delete a client
 */
export async function deleteClient(id: string): Promise<void> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('clients')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }
    }, DB_RETRY_OPTIONS);

    if (!result.success) {
        logError(result.error || new Error('Failed to delete client'), {
            component: 'SupabaseService',
            action: 'deleteClient',
            clientId: id,
        });
        throw result.error || new SupabaseError('Failed to delete client', 'DELETE_ERROR');
    }

    logInfo('Client deleted successfully', { clientId: id });
}

// =============================================================================
// RESERVATIONS SERVICE
// =============================================================================

/**
 * Fetch all reservations for the current user
 */
export async function fetchReservations(): Promise<Reservation[]> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();
        await getUserId(); // Ensure session exists

        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .is('deleted_at', null)
            .order('start_date', { ascending: false });

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return data.map(mapDbReservationToReservation);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to fetch reservations'), {
            component: 'SupabaseService',
            action: 'fetchReservations',
        });
        throw result.error || new SupabaseError('Failed to fetch reservations', 'FETCH_ERROR');
    }

    logInfo(`Fetched ${result.data.length} reservations from Supabase`);
    return result.data;
}

/**
 * Create a new reservation
 */
export async function createReservation(reservation: Omit<Reservation, 'id'>): Promise<Reservation> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();
        const userId = await getUserId();

        const insertData: InsertReservation = {
            client_id: reservation.clientId,
            cabin_count: reservation.cabinCount,
            start_date: reservation.startDate,
            end_date: reservation.endDate,
            adults: reservation.adults,
            children: reservation.children,
            total_amount: reservation.totalAmount,
            status: reservation.status,
            is_archived: reservation.isArchived || false,
            user_id: userId,
        };

        const { data, error } = await supabase
            .from('reservations')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return mapDbReservationToReservation(data);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to create reservation'), {
            component: 'SupabaseService',
            action: 'createReservation',
            reservation,
        });
        throw result.error || new SupabaseError('Failed to create reservation', 'CREATE_ERROR');
    }

    logInfo('Reservation created successfully', { reservationId: result.data.id });
    return result.data;
}

/**
 * Update an existing reservation
 */
export async function updateReservation(reservation: Reservation): Promise<Reservation> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const updateData: UpdateReservation = {
            client_id: reservation.clientId,
            cabin_count: reservation.cabinCount,
            start_date: reservation.startDate,
            end_date: reservation.endDate,
            adults: reservation.adults,
            children: reservation.children,
            total_amount: reservation.totalAmount,
            status: reservation.status,
            is_archived: reservation.isArchived || false,
        };

        const { data, error } = await supabase
            .from('reservations')
            .update(updateData)
            .eq('id', reservation.id)
            .select()
            .single();

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return mapDbReservationToReservation(data);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to update reservation'), {
            component: 'SupabaseService',
            action: 'updateReservation',
            reservationId: reservation.id,
        });
        throw result.error || new SupabaseError('Failed to update reservation', 'UPDATE_ERROR');
    }

    logInfo('Reservation updated successfully', { reservationId: result.data.id });
    return result.data;
}

/**
 * Update reservation status
 */
export async function updateReservationStatus(
    id: string,
    status: ReservationStatus
): Promise<void> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('reservations')
            .update({ status })
            .eq('id', id);

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }
    }, DB_RETRY_OPTIONS);

    if (!result.success) {
        logError(result.error || new Error('Failed to update reservation status'), {
            component: 'SupabaseService',
            action: 'updateReservationStatus',
            reservationId: id,
            status,
        });
        throw result.error || new SupabaseError('Failed to update reservation status', 'STATUS_ERROR');
    }

    logInfo('Reservation status updated', { reservationId: id, status });
}

/**
 * Archive a reservation
 */
export async function archiveReservation(id: string): Promise<void> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('reservations')
            .update({ is_archived: true })
            .eq('id', id);

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }
    }, DB_RETRY_OPTIONS);

    if (!result.success) {
        logError(result.error || new Error('Failed to archive reservation'), {
            component: 'SupabaseService',
            action: 'archiveReservation',
            reservationId: id,
        });
        throw result.error || new SupabaseError('Failed to archive reservation', 'ARCHIVE_ERROR');
    }

    logInfo('Reservation archived', { reservationId: id });
}

/**
 * Soft delete a reservation
 */
export async function deleteReservation(id: string): Promise<void> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('reservations')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }
    }, DB_RETRY_OPTIONS);

    if (!result.success) {
        logError(result.error || new Error('Failed to delete reservation'), {
            component: 'SupabaseService',
            action: 'deleteReservation',
            reservationId: id,
        });
        throw result.error || new SupabaseError('Failed to delete reservation', 'DELETE_ERROR');
    }

    logInfo('Reservation deleted successfully', { reservationId: id });
}

// =============================================================================
// TRANSACTIONS SERVICE
// =============================================================================

/**
 * Fetch all transactions for the current user
 */
export async function fetchTransactions(): Promise<Transaction[]> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();
        await getUserId(); // Ensure session exists

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .is('deleted_at', null)
            .order('date', { ascending: false });

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return data.map(mapDbTransactionToTransaction);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to fetch transactions'), {
            component: 'SupabaseService',
            action: 'fetchTransactions',
        });
        throw result.error || new SupabaseError('Failed to fetch transactions', 'FETCH_ERROR');
    }

    logInfo(`Fetched ${result.data.length} transactions from Supabase`);
    return result.data;
}

/**
 * Create a new transaction
 */
export async function createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();
        const userId = await getUserId();

        const insertData: InsertTransaction = {
            date: transaction.date,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            description: transaction.description,
            payment_method: transaction.paymentMethod,
            reservation_id: transaction.reservationId || null,
            user_id: userId,
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return mapDbTransactionToTransaction(data);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to create transaction'), {
            component: 'SupabaseService',
            action: 'createTransaction',
            transaction,
        });
        throw result.error || new SupabaseError('Failed to create transaction', 'CREATE_ERROR');
    }

    logInfo('Transaction created successfully', { transactionId: result.data.id });
    return result.data;
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(transaction: Transaction): Promise<Transaction> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const updateData: UpdateTransaction = {
            date: transaction.date,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            description: transaction.description,
            payment_method: transaction.paymentMethod,
            reservation_id: transaction.reservationId || null,
        };

        const { data, error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', transaction.id)
            .select()
            .single();

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return mapDbTransactionToTransaction(data);
    }, DB_RETRY_OPTIONS);

    if (!result.success || !result.data) {
        logError(result.error || new Error('Failed to update transaction'), {
            component: 'SupabaseService',
            action: 'updateTransaction',
            transactionId: transaction.id,
        });
        throw result.error || new SupabaseError('Failed to update transaction', 'UPDATE_ERROR');
    }

    logInfo('Transaction updated successfully', { transactionId: result.data.id });
    return result.data;
}

/**
 * Soft delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('transactions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }
    }, DB_RETRY_OPTIONS);

    if (!result.success) {
        logError(result.error || new Error('Failed to delete transaction'), {
            component: 'SupabaseService',
            action: 'deleteTransaction',
            transactionId: id,
        });
        throw result.error || new SupabaseError('Failed to delete transaction', 'DELETE_ERROR');
    }

    logInfo('Transaction deleted successfully', { transactionId: id });
}

// =============================================================================
// SYSTEM CONFIG SERVICE
// =============================================================================

/**
 * Get system configuration value
 */
export async function getSystemConfig<T = unknown>(key: string): Promise<T | null> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('system_config')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null;
            }
            throw new SupabaseError(error.message, error.code, error.details);
        }

        return data.value as T;
    }, DB_RETRY_OPTIONS);

    if (result.success) {
        return result.data as T;
    }

    // Special case for PGRST116 (NotFound) which should not throw but return null
    if (result.error instanceof SupabaseError && result.error.code === 'PGRST116') {
        return null;
    }

    logError(result.error || new Error('Failed to get system config'), {
        component: 'SupabaseService',
        action: 'getSystemConfig',
        key,
    });
    throw result.error || new SupabaseError('Failed to get system config', 'CONFIG_ERROR');
}

/**
 * Set system configuration value
 */
export async function setSystemConfig(
    key: string,
    value: unknown,
    description?: string
): Promise<void> {
    const result = await withRetry(async () => {
        const supabase = getSupabaseClient();
        const userId = await getUserId();

        const { error } = await supabase
            .from('system_config')
            .upsert({
                key,
                value: value as never,
                description: description || null,
                user_id: userId,
            });

        if (error) {
            throw new SupabaseError(error.message, error.code, error.details);
        }
    }, DB_RETRY_OPTIONS);

    if (!result.success) {
        logError(result.error || new Error('Failed to set system config'), {
            component: 'SupabaseService',
            action: 'setSystemConfig',
            key,
        });
        throw result.error || new SupabaseError('Failed to set system config', 'CONFIG_ERROR');
    }

    logInfo('System config updated', { key });
}
