import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useFinancialsContextValue } from './hooks/useFinancialsContextValue';
import { Transaction } from '@/types';
import { StorageAdapter } from '@/services/storageAdapter';
import { logError, logInfo } from '@/utils/logger';


export interface FinancialsContextValue {
  data: Transaction[];
  count: number | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const FinancialsContext = createContext<FinancialsContextValue | undefined>(undefined);

export function FinancialsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Transaction[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await StorageAdapter.getTransactions({
        page: currentPage,
        limit: value.pageSize,
      });
      setData(result.data);
      setCount(result.count);
      logInfo('Paginated transactions loaded', { page: currentPage, pageSize: PAGE_SIZE, count: result.count });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching transactions';
      setError(message);
      logError(err as Error, { component: 'FinancialsContext', action: 'fetchTransactions', page: currentPage });
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const refresh = useCallback(async () => fetchPage(), [fetchPage]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    try {
      await StorageAdapter.addTransaction(transaction);
      await fetchPage();
      logInfo('Transaction added through context');
    } catch (err) {
      logError(err as Error, { component: 'FinancialsContext', action: 'addTransaction' });
      throw err;
    }
  }, [fetchPage]);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    try {
      await StorageAdapter.updateTransaction(transaction);
      await fetchPage();
      logInfo('Transaction updated through context', { transactionId: transaction.id });
    } catch (err) {
      logError(err as Error, { component: 'FinancialsContext', action: 'updateTransaction' });
      throw err;
    }
  }, [fetchPage]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await StorageAdapter.deleteTransaction(id);
      await fetchPage();
      logInfo('Transaction deleted through context', { transactionId: id });
    } catch (err) {
      logError(err as Error, { component: 'FinancialsContext', action: 'deleteTransaction' });
      throw err;
    }
  }, [fetchPage]);

  const value = useFinancialsContextValue({
    data,
    count,
    loading,
    error,
    currentPage,
    setCurrentPage,
    refresh,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  });
  return <FinancialsContext.Provider value={value}>{children}</FinancialsContext.Provider>;
}

export function useFinancialsContext() {
  const context = useContext(FinancialsContext);
  if (!context) {
    throw new Error('useFinancialsContext must be used within FinancialsProvider');
  }
  return context;
}
