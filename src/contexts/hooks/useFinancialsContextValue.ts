import React from 'react';
import { PAGE_SIZE } from '../constants/FinancialsContext.constants';
import type { Transaction } from '@/types';
import type { FinancialsContextValue } from '../FinancialsContext';
export function useFinancialsContextValue({
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
}: {
  data: Transaction[];
  count: number | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refresh: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}): FinancialsContextValue {
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
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [data, count, loading, error, currentPage, setCurrentPage, refresh, addTransaction, updateTransaction, deleteTransaction]
  );
}