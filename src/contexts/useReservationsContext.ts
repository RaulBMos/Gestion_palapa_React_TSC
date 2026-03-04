import { useContext } from 'react';
import { ReservationsContext } from './ReservationsContext';

export function useReservationsContext() {
  const context = useContext(ReservationsContext);
  if (!context) {
    throw new Error('useReservationsContext must be used within ReservationsProvider');
  }
  return context;
}