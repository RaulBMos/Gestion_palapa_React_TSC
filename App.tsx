import React, { useState } from 'react';
import { ErrorBoundary } from './components/templates/ErrorBoundary';
import { Layout } from './components/templates/Layout';
import { Dashboard } from './components/organisms/Dashboard';
import { Reservations } from './components/organisms/Reservations';
import { Finances } from './components/organisms/Finances';
import { Clients } from './components/organisms/Clients';
import { ViewState } from './types';
import { DataProvider } from './contexts/DataContext';

// ============================================================================
// CONTENEDOR PRINCIPAL - Envuelve todo con DataProvider
// ============================================================================

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ErrorBoundary>
  );
}

// ============================================================================
// CONTENIDO DE LA APP - Routing sin lógica de estado
// ============================================================================

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'reservations':
        return <Reservations />;
      case 'finances':
        return <Finances />;
      case 'clients':
        return <Clients />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
}
