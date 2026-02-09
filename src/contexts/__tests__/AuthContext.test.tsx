import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '@/contexts/useAuth';
import { createSupabaseMock, createSupabaseQueryMock } from '../../test/mocks/supabase.mock';

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
    const { user, loading, error, signIn, signInWithPassword, signUp, signOut, role } = useAuth();
    return (
        <div>
            <div data-testid="loading">{String(loading)}</div>
            <div data-testid="user-id">{user?.id || 'no-user'}</div>
            <div data-testid="role">{role || 'no-role'}</div>
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
        });

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
        });

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

    it('defaults role to viewer when profile lookup fails', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: 'profile-fail' } } },
            error: null,
        });
        mockSupabase.from.mockReturnValue(createSupabaseQueryMock({ data: null, error: new Error('profile fail') }));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('role').textContent).toBe('viewer');
        });
    });

    it('captures errors when Supabase client creation fails', async () => {
        getSupabaseClientMock.mockImplementationOnce(() => {
            throw new Error('supabase down');
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('error').textContent).toBe('supabase down');
            expect(screen.getByTestId('role').textContent).toBe('no-role');
        });
    });

    it('should handle signIn with Magic Link', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
        mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

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
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

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
        });
        mockSupabase.auth.signOut.mockResolvedValue({ error: null });

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
