import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/templates/ErrorBoundary';
import { Layout } from '@/components/templates/Layout';
import { Dashboard } from '@/components/organisms/Dashboard';
import { Reservations } from '@/components/organisms/Reservations';
import { Finances } from '@/components/organisms/Finances';
import { Clients } from '@/components/organisms/Clients';
import { DataProvider } from '@/contexts/DataProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Login } from '@/components/pages/Auth/Login';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
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
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}