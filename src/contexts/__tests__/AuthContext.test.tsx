import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { createSupabaseMock } from '../../test/mocks/supabase.mock';

// 1. Setup Mock Hoisted - Correcto para evitar problemas de orden en Vitest
const { getSupabaseClientMock } = vi.hoisted(() => {
    return { getSupabaseClientMock: vi.fn() };
});

// 2. Mock Module - Ruta relativa exacta para coincidir con AuthContext
vi.mock('../../config/supabase', () => ({
    getSupabaseClient: getSupabaseClientMock,
}));

// Componente de Prueba - Expone el estado interno para verificar
const TestComponent = () => {
    const { user, loading, error, signIn, signInWithPassword, signUp, signOut } = useAuth();
    return (
        <div>
            <div data-testid="loading">{String(loading)}</div>
            <div data-testid="user-id">{user?.id || 'no-user'}</div>
            <div data-testid="error">{error?.message || 'no-error'}</div>

            <button onClick={() => signIn('magic@test.com')}>Sign In Magic</button>
            <button onClick={() => signInWithPassword('pass@test.com', 'password')}>Sign In Password</button>
            <button onClick={() => signUp('new@test.com', 'password')}>Sign Up</button>
            <button onClick={() => signOut()}>Sign Out</button>
        </div>
    );
};

describe('AuthContext Integration Tests', () => {
    let mockSupabase: ReturnType<typeof createSupabaseMock>;

    beforeEach(() => {
        vi.useRealTimers(); // Asegurar timers reales explícitamente
        vi.clearAllMocks();
        mockSupabase = createSupabaseMock();
        getSupabaseClientMock.mockReturnValue(mockSupabase);
    });

    it('should initialize successfully with session', async () => {
        // Mock session response
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: 'test-user-init' } } },
            error: null,
        } as any);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Esperar que loading sea false y usuario esté presente
        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
            expect(screen.getByTestId('user-id').textContent).toBe('test-user-init');
        });
    });

    it('should handle logic error during initialization', async () => {
        const errorMsg = 'Init failed';
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: { message: errorMsg },
        } as any);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
            expect(screen.getByTestId('error').textContent).toBe(errorMsg);
        });
    });

    it('should handle signIn with Magic Link', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null } as any);
        mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null } as any);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

        const btn = screen.getByText('Sign In Magic');
        await act(async () => {
            btn.click();
        });

        expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
            email: 'magic@test.com',
            options: expect.anything()
        });
    });

    it('should handle signIn with Password', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null } as any);
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null } as any);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

        const btn = screen.getByText('Sign In Password');
        await act(async () => {
            btn.click();
        });

        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'pass@test.com',
            password: 'password'
        });
    });

    it('should handle signOut', async () => {
        // Iniciar con usuario
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: 'user-to-logout' } } },
            error: null,
        } as any);
        mockSupabase.auth.signOut.mockResolvedValue({ error: null } as any);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('user-to-logout'));

        const btn = screen.getByText('Sign Out');
        await act(async () => {
            btn.click();
        });

        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        // Verificar que el usuario se limpia (AuthContext lo hace manualmente en signOut)
        await waitFor(() => {
            expect(screen.getByTestId('user-id').textContent).toBe('no-user');
        });
    });
});
