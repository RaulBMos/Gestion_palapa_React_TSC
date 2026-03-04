import { useContext } from 'react';
import { FinancialsContext } from '@/contexts/FinancialsContextContext';

export function useFinancials() {
  const context = useContext(FinancialsContext);
  if (!context) {
    throw new Error('useFinancials must be used within a FinancialsProvider');
  }
  return context;
}
