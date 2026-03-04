import { useContext } from 'react';
import { FinancialsContext } from './FinancialsContext';

export function useFinancialsContext() {
  const context = useContext(FinancialsContext);
  if (!context) {
    throw new Error('useFinancialsContext must be used within FinancialsProvider');
  }
  return context;
}