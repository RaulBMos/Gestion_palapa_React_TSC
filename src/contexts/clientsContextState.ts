import { createContext, useContext } from 'react';
import type { Client } from '@/types';

export interface ClientsContextValue {
  data: Client[];
  count: number | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const ClientsContext = createContext<ClientsContextValue | undefined>(undefined);

export function useClientsContext() {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClientsContext must be used within ClientsProvider');
  }
  return context;
}
