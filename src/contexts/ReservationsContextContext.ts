import { createContext } from 'react';
import { ReservationsContextValue } from './types/ReservationsContextValue';

export const ReservationsContext = createContext<ReservationsContextValue | undefined>(undefined);