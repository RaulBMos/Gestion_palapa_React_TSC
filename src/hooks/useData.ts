import { useClients } from '@/hooks/useClients';
import { useReservations } from '@/hooks/useReservations';
import { useFinancials } from '@/hooks/useFinancials';

export function useDataState() {
  const { data: clients } = useClients();
  const { data: reservations, totalCabins } = useReservations();
  const { data: transactions } = useFinancials();

  return { clients, reservations, transactions, totalCabins };
}
