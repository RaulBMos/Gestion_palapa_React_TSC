import React from 'react';
import { PAGE_SIZE } from '../constants/ClientsContext.constants';
import type { Client } from '@/types';
import type { ClientsContextValue } from '../ClientsContext';
export function useClientsContextValue({
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
}: {
  data: Client[];
  count: number | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refresh: () => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}): ClientsContextValue {
  return React.useMemo(
    () => ({
      data,
      count,
      loading,
      error,
      currentPage,
      pageSize: PAGE_SIZE,
      setPage: setCurrentPage,
      refresh,
      addClient,
      updateClient,
      deleteClient,
    }),
    [data, count, loading, error, currentPage, setCurrentPage, refresh, addClient, updateClient, deleteClient]
  );
}