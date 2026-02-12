import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/templates/ErrorBoundary';
import { Layout } from '@/components/templates/Layout';
import { Dashboard } from '@/components/organisms/Dashboard';
import { Reservations } from '@/components/organisms/Reservations';
import { Finances } from '@/components/organisms/Finances';
import { Clients } from '@/components/organisms/Clients';
import { MainDataProvider } from '@/contexts/DataProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Login } from '@/components/pages/Auth/Login';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';


// SENSOR DE DIAGNÓSTICO TIER-1
console.log("=== DIAGNÓSTICO DE VARIABLES DE ENTORNO ===");
console.log("VITE_GEMINI_API_KEY detectada:", import.meta.env.VITE_GEMINI_API_KEY ? "✅ SÍ" : "❌ NO");
console.log("VITE_SUPABASE_URL detectada:", import.meta.env.VITE_SUPABASE_URL ? "✅ SÍ" : "❌ NO");
console.log("Modo de ejecución:", import.meta.env.MODE);
console.log("==========================================");

export default function App() {
  return (
    <ErrorBoundary>
        <AuthProvider>
          <MainDataProvider>
          <Routes>
            {/* Rutas Públicas - Solo Login */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Protegidas */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/clients" element={<Clients />} />
            </Route>

            {/* Fallback - Redirigir a Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </MainDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
