import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase';
import { logError } from '@/utils/logger';

// ============================================================================
// TIPOS
// ============================================================================

export type UserRole = 'admin' | 'viewer';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: UserRole | null;
    loading: boolean;
    error: AuthError | null;
    signIn: (email: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    isAdmin: boolean;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVEEDOR
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<AuthError | null>(null);

    // Función auxiliar para obtener el rol
    const fetchUserProfile = async (userId: string) => {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) throw error;
            if (data) setRole(data.role as UserRole);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setRole('viewer'); // Por seguridad, rol por defecto es el más restringido
        }
    };

    useEffect(() => {
        let mounted = true;
        let authSubscription: { unsubscribe: () => void } | null = null;

        async function initializeAuth() {
            try {
                const supabase = getSupabaseClient();

                // 1. Obtener sesión actual
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchUserProfile(session.user.id);
                    }
                }

                // 2. Suscribirse a cambios de auth
                const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
                    if (mounted) {
                        setSession(session);
                        setUser(session?.user ?? null);
                        if (session?.user) {
                            await fetchUserProfile(session.user.id);
                        } else {
                            setRole(null);
                        }
                        setLoading(false);
                    }
                });
                authSubscription = data.subscription;

            } catch (err) {
                if (mounted) {
                    setError(err as AuthError);
                    logError(err as Error, { component: 'AuthProvider', action: 'initialize' });
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        initializeAuth();

        return () => {
            mounted = false;
            if (authSubscription) {
                authSubscription.unsubscribe();
            }
        };
    }, []);

    // ✅ Iniciar sesión con Magic Link
    const signIn = async (email: string) => {
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });

            if (error) throw error;
            return { error: null };
        } catch (err) {
            logError(err as Error, { component: 'AuthProvider', action: 'signIn' });
            return { error: err as AuthError };
        }
    };

    // ✅ Iniciar sesión con Contraseña
    const signInWithPassword = async (email: string, password: string) => {
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return { error: null };
        } catch (err) {
            logError(err as Error, { component: 'AuthProvider', action: 'signInWithPassword' });
            return { error: err as AuthError };
        }
    };

    // ✅ Registrarse (Manual por Admin)
    const signUp = async (email: string, password: string) => {
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;
            return { error: null };
        } catch (err) {
            logError(err as Error, { component: 'AuthProvider', action: 'signUp' });
            return { error: err as AuthError };
        }
    };

    // ✅ Cerrar sesión
    const signOut = async () => {
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setUser(null);
            setSession(null);
            setRole(null);
            return { error: null };
        } catch (err) {
            logError(err as Error, { component: 'AuthProvider', action: 'signOut' });
            return { error: err as AuthError };
        }
    };

    const value = {
        user,
        session,
        role,
        loading,
        error,
        signIn,
        signInWithPassword,
        signUp,
        signOut,
        isAdmin: role === 'admin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
