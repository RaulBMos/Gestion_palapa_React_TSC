import { useClients } from '@/hooks/useClients';
import { useReservations } from '@/hooks/useReservations';
import { useFinancials } from '@/hooks/useFinancials';

export function useDataState() {
  const { data: clients } = useClients();
  const { data: reservations, totalCabins } = useReservations();
  const { data: transactions, allData: allTransactions } = useFinancials();

  return { clients, reservations, transactions, allTransactions, totalCabins };
}
