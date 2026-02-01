/**
 * Supabase Database TypeScript Definitions
 * Auto-generated types based on database schema
 * 
 * These types ensure type-safety when interacting with Supabase
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

/**
 * Database schema definition
 */
export interface Database {
    public: {
        Tables: {
            clients: {
                Row: {
                    id: string;
                    name: string;
                    email: string;
                    phone: string;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                    user_id: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    email: string;
                    phone: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    email?: string;
                    phone?: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    user_id?: string | null;
                };
            };
            reservations: {
                Row: {
                    id: string;
                    client_id: string;
                    cabin_count: number;
                    start_date: string;
                    end_date: string;
                    adults: number;
                    children: number;
                    total_amount: number;
                    status: 'Información' | 'Confirmada' | 'Completada' | 'Cancelada';
                    is_archived: boolean;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                    user_id: string | null;
                };
                Insert: {
                    id?: string;
                    client_id: string;
                    cabin_count: number;
                    start_date: string;
                    end_date: string;
                    adults?: number;
                    children?: number;
                    total_amount: number;
                    status: 'Información' | 'Confirmada' | 'Completada' | 'Cancelada';
                    is_archived?: boolean;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    id?: string;
                    client_id?: string;
                    cabin_count?: number;
                    start_date?: string;
                    end_date?: string;
                    adults?: number;
                    children?: number;
                    total_amount?: number;
                    status?: 'Información' | 'Confirmada' | 'Completada' | 'Cancelada';
                    is_archived?: boolean;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    user_id?: string | null;
                };
            };
            transactions: {
                Row: {
                    id: string;
                    date: string;
                    amount: number;
                    type: 'Ingreso' | 'Gasto';
                    category: string;
                    description: string;
                    payment_method: 'Efectivo' | 'Transferencia';
                    reservation_id: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                    user_id: string | null;
                };
                Insert: {
                    id?: string;
                    date?: string;
                    amount: number;
                    type: 'Ingreso' | 'Gasto';
                    category: string;
                    description: string;
                    payment_method: 'Efectivo' | 'Transferencia';
                    reservation_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    id?: string;
                    date?: string;
                    amount?: number;
                    type?: 'Ingreso' | 'Gasto';
                    category?: string;
                    description?: string;
                    payment_method?: 'Efectivo' | 'Transferencia';
                    reservation_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    user_id?: string | null;
                };
            };
            system_config: {
                Row: {
                    id: string;
                    key: string;
                    value: Json;
                    description: string | null;
                    user_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    key: string;
                    value: Json;
                    description?: string | null;
                    user_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    key?: string;
                    value?: Json;
                    description?: string | null;
                    user_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: {
            v_active_reservations: {
                Row: {
                    id: string;
                    client_id: string;
                    cabin_count: number;
                    start_date: string;
                    end_date: string;
                    adults: number;
                    children: number;
                    total_amount: number;
                    status: 'Información' | 'Confirmada' | 'Completada' | 'Cancelada';
                    is_archived: boolean;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                    user_id: string | null;
                    client_name: string;
                    client_email: string;
                    client_phone: string;
                    nights: number;
                    daily_rate: number;
                };
            };
            v_transactions_detailed: {
                Row: {
                    id: string;
                    date: string;
                    amount: number;
                    type: 'Ingreso' | 'Gasto';
                    category: string;
                    description: string;
                    payment_method: 'Efectivo' | 'Transferencia';
                    reservation_id: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                    user_id: string | null;
                    client_id: string | null;
                    reservation_start: string | null;
                    reservation_end: string | null;
                    client_name: string | null;
                };
            };
        };
        Functions: {
            check_cabin_availability: {
                Args: {
                    p_start_date: string;
                    p_end_date: string;
                    p_cabin_count: number;
                    p_total_cabins: number;
                    p_exclude_reservation_id?: string;
                };
                Returns: Array<{
                    date: string;
                    available_cabins: number;
                    occupied_cabins: number;
                }>;
            };
            get_financial_summary: {
                Args: {
                    p_user_id: string;
                    p_start_date?: string;
                    p_end_date?: string;
                };
                Returns: {
                    total_income: number;
                    total_expenses: number;
                    net_profit: number;
                    profit_margin: number;
                    transaction_count: number;
                };
            };
            get_occupancy_stats: {
                Args: {
                    p_user_id: string;
                    p_start_date: string;
                    p_end_date: string;
                    p_total_cabins: number;
                };
                Returns: {
                    total_nights: number;
                    occupied_nights: number;
                    occupancy_rate: number;
                    total_revenue: number;
                    adr: number;
                    revpar: number;
                };
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

/**
 * Type helpers for better DX
 */
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row'];

export type Insertable<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert'];

export type Updatable<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update'];

/**
 * Convenient aliases for common types
 */
export type DbClient = Tables<'clients'>;
export type DbReservation = Tables<'reservations'>;
export type DbTransaction = Tables<'transactions'>;
export type DbSystemConfig = Tables<'system_config'>;

export type InsertClient = Insertable<'clients'>;
export type InsertReservation = Insertable<'reservations'>;
export type InsertTransaction = Insertable<'transactions'>;

export type UpdateClient = Updatable<'clients'>;
export type UpdateReservation = Updatable<'reservations'>;
export type UpdateTransaction = Updatable<'transactions'>;
