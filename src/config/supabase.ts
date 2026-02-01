/**
 * Supabase Client Configuration
 * Manages connection to Supabase backend with retry logic and error handling
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.types';
import { logError, logInfo } from '@/utils/logger';

/**
 * Environment variable validation
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Feature flag to enable/disable Supabase
 */
export const isSupabaseEnabled = () => import.meta.env.VITE_USE_SUPABASE === 'true';

/**
 * Accessor for the feature flag
 */
export const USE_SUPABASE = isSupabaseEnabled();

/**
 * Validates that all required environment variables are present
 * @throws Error if any required variable is missing
 */
function validateSupabaseConfig(): void {
  if (!USE_SUPABASE) {
    logInfo('Supabase is disabled via feature flag');
    return;
  }

  if (!SUPABASE_URL || SUPABASE_URL === 'your_supabase_url_here') {
    throw new Error(
      'VITE_SUPABASE_URL is not configured. Please add it to your .env.local file'
    );
  }

  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your_supabase_anon_key_here') {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is not configured. Please add it to your .env.local file'
    );
  }

  // Validate URL format
  try {
    new URL(SUPABASE_URL);
  } catch {
    throw new Error(`Invalid VITE_SUPABASE_URL format: ${SUPABASE_URL}`);
  }

  logInfo('Supabase configuration validated successfully', {
    url: SUPABASE_URL,
    keyLength: SUPABASE_ANON_KEY.length,
  });
}

/**
 * Create and configure Supabase client
 */
let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Get or create Supabase client instance (Singleton pattern)
 * @returns Configured Supabase client
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!USE_SUPABASE) {
    throw new Error('Supabase is disabled. Set VITE_USE_SUPABASE=true to enable it');
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    validateSupabaseConfig();

    supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
      global: {
        headers: {
          'x-application-name': 'CasaGestion-PWA',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    logInfo('Supabase client initialized successfully');
    return supabaseClient;
  } catch (error) {
    logError(error as Error, {
      component: 'supabaseClient',
      action: 'initialization',
    });
    throw error;
  }
}

/**
 * Reset Supabase client (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
  logInfo('Supabase client reset');
}

/**
 * Check if Supabase is properly configured and accessible
 * @returns Promise that resolves to true if connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  if (!USE_SUPABASE) {
    return false;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.from('clients').select('count', { count: 'exact', head: true });

    if (error) {
      logError(new Error('Supabase health check failed'), {
        component: 'supabaseClient',
        action: 'healthCheck',
      }, { error });
      return false;
    }

    logInfo('Supabase health check passed');
    return true;
  } catch (error) {
    logError(error as Error, {
      component: 'supabaseClient',
      action: 'healthCheck',
    });
    return false;
  }
}

/**
 * Export configured client for direct use
 * Use getSupabaseClient() instead for better error handling
 */
export const supabase = USE_SUPABASE ? getSupabaseClient() : null;
