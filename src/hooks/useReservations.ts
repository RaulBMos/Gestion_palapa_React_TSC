import { useContext } from 'react';
import { ReservationsContext } from '@/contexts/ReservationsContext';

export function useReservations() {
  const context = useContext(ReservationsContext);
  if (!context) {
    throw new Error('useReservations must be used within a ReservationsProvider');
  }
  return context;
}
