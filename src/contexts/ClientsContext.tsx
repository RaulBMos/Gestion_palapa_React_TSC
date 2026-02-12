import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useClientsContextValue } from './hooks/useClientsContextValue';
import { Client } from '@/types';
import { StorageAdapter } from '@/services/storageAdapter';
import { logError, logInfo } from '@/utils/logger';

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

const ClientsContext = createContext<ClientsContextValue | undefined>(undefined);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Client[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await StorageAdapter.getClients({
        page: currentPage,
        limit: value.pageSize,
      });
      setData(result.data);
      setCount(result.count);
      logInfo('Paginated clients loaded', { page: currentPage, pageSize: PAGE_SIZE, count: result.count });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching clients';
      setError(message);
      logError(err as Error, { component: 'ClientsContext', action: 'loadClients', page: currentPage });
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const refresh = useCallback(async () => {
    return loadPage();
  }, [loadPage]);

  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    try {
      await StorageAdapter.addClient(client);
      await loadPage();
      logInfo('Client added through context');
    } catch (err) {
      logError(err as Error, { component: 'ClientsContext', action: 'addClient' });
      throw err;
    }
  }, [loadPage]);

  const updateClient = useCallback(async (client: Client) => {
    try {
      await StorageAdapter.updateClient(client);
      await loadPage();
      logInfo('Client updated through context', { clientId: client.id });
    } catch (err) {
      logError(err as Error, { component: 'ClientsContext', action: 'updateClient' });
      throw err;
    }
  }, [loadPage]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      await StorageAdapter.deleteClient(id);
      await loadPage();
      logInfo('Client deleted through context', { clientId: id });
    } catch (err) {
      logError(err as Error, { component: 'ClientsContext', action: 'deleteClient' });
      throw err;
    }
  }, [loadPage]);

  const value = useClientsContextValue({
    data,
    count,
    loading,
    error,
    currentPage,
    setCurrentPage,
    refresh,
    addClient,
    updateClient,
    deleteClient,
  });
  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClientsContext() {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClientsContext must be used within ClientsProvider');
  }
  return context;
}
