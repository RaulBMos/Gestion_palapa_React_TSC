/**
 * Supabase Client Mock
 * Provides a highly configurable mock for the @supabase/supabase-js client.
 */

import { vi } from 'vitest';

type QueryResult<T> = {
    data: T | null;
    error: unknown;
    count: number | null;
};

type SupabaseQueryMock<T> = {
    select: (...args: unknown[]) => SupabaseQueryMock<T>;
    insert: (...args: unknown[]) => SupabaseQueryMock<T>;
    update: (...args: unknown[]) => SupabaseQueryMock<T>;
    upsert: (...args: unknown[]) => SupabaseQueryMock<T>;
    delete: (...args: unknown[]) => SupabaseQueryMock<T>;
    eq: (...args: unknown[]) => SupabaseQueryMock<T>;
    neq: (...args: unknown[]) => SupabaseQueryMock<T>;
    gt: (...args: unknown[]) => SupabaseQueryMock<T>;
    lt: (...args: unknown[]) => SupabaseQueryMock<T>;
    is: (...args: unknown[]) => SupabaseQueryMock<T>;
    in: (...args: unknown[]) => SupabaseQueryMock<T>;
    order: (...args: unknown[]) => SupabaseQueryMock<T>;
    limit: (...args: unknown[]) => SupabaseQueryMock<T>;
    single: () => Promise<Omit<QueryResult<T>, 'count'>>;
    maybeSingle: () => Promise<Omit<QueryResult<T>, 'count'>>;
    then: (onfulfilled: (value: QueryResult<T>) => unknown) => Promise<unknown>;
};

/**
 * Creates a configurable chainable mock for Supabase queries
 * Usage:
 *   mockFrom.mockReturnValue(createSupabaseQueryMock({ data: [...] }));
 */
export const createSupabaseQueryMock = <T = unknown>({
    data = null,
    error = null,
    count = null,
}: {
    data?: T | null;
    error?: unknown;
    count?: number | null;
}): SupabaseQueryMock<T> => {
    const resolveSingle = () => Promise.resolve({ data, error });
    const resolveFull = () => Promise.resolve({ data, error, count });

    const chain: SupabaseQueryMock<T> = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        upsert: vi.fn(() => chain),
        delete: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        neq: vi.fn(() => chain),
        gt: vi.fn(() => chain),
        lt: vi.fn(() => chain),
        is: vi.fn(() => chain),
        in: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        single: vi.fn(resolveSingle),
        maybeSingle: vi.fn(resolveSingle),
        then: vi.fn((onfulfilled) => resolveFull().then(onfulfilled)),
    };

    return chain;
};

/**
 * Full Supabase Client Mock Object
 */
export const createSupabaseMock = () => {
    const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-uuid' } },
            error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { id: 'test-user-uuid' } } },
            error: null,
        }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
    };

    const mockFrom = vi.fn().mockReturnValue(createSupabaseQueryMock({ data: [] }));

    return {
        auth: mockAuth,
        from: mockFrom,
        rpc: vi.fn(),
        storage: {
            from: vi.fn().mockReturnValue({
                upload: vi.fn(),
                download: vi.fn(),
                list: vi.fn(),
                remove: vi.fn(),
            }),
        },
    };
};

/**
 * Mock instance for use in simple scenarios
 */
export const SUPABASE_MOCK = createSupabaseMock();
