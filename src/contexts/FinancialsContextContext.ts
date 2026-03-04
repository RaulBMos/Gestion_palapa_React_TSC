import { createContext } from 'react';
import { FinancialsContextValue } from './types/FinancialsContextValue';

export const FinancialsContext = createContext<FinancialsContextValue | undefined>(undefined);