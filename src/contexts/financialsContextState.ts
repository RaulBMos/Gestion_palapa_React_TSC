import { createContext, useContext } from 'react';
import type { Transaction } from '@/types';

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

export const FinancialsContext = createContext<FinancialsContextValue | undefined>(undefined);

export function useFinancialsContext() {
  const context = useContext(FinancialsContext);
  if (!context) {
    throw new Error('useFinancialsContext must be used within FinancialsProvider');
  }
  return context;
}
