import { createContext } from 'react';
import { ClientsContextValue } from './types/ClientsContextValue';

export const ClientsContext = createContext<ClientsContextValue | undefined>(undefined);