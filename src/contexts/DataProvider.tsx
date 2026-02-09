import React from 'react';
import { ClientsProvider } from '@/contexts/ClientsContext';
import { ReservationsProvider } from '@/contexts/ReservationsContext';
import { FinancialsProvider } from '@/contexts/FinancialsContext';

interface MainDataProviderProps {
  children: React.ReactNode;
}

export function MainDataProvider({ children }: MainDataProviderProps) {
  return (
    <ClientsProvider>
      <ReservationsProvider>
        <FinancialsProvider>
          {children}
        </FinancialsProvider>
      </ReservationsProvider>
    </ClientsProvider>
  );
}
