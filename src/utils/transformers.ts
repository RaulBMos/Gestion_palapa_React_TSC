import { Transaction, MonthlyData, ExpenseCategory, TransactionType } from '@/types';

/**
 * Agrupa transacciones por mes y calcula ingresos y gastos mensuales
 * 
 * @param transactions - Array de transacciones a procesar
 * @returns Array de MonthlyData ordenado cronológicamente (últimos 6 meses)
 * 
 * @example
 * const transactions = [
 *   { date: '2024-01-15', amount: 1000, type: TransactionType.INCOME },
 *   { date: '2024-01-20', amount: 200, type: TransactionType.EXPENSE }
 * ];
 * const result = mapTransactionsToMonthlyData(transactions);
 * // Returns: [{ name: 'ene 2024', ingresos: 1000, gastos: 200 }]
 */
export const mapTransactionsToMonthlyData = (transactions: Transaction[]): MonthlyData[] => {
  // Objeto para acumular datos por mes
  const monthlyData: Record<string, { ingresos: number; gastos: number }> = {};

  // Agrupar transacciones por mes
  transactions.forEach((transaction) => {
    // Formato: "ene 2024", "feb 2024", etc.
    const monthKey = new Date(transaction.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
    });

    // Inicializar mes si no existe
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { ingresos: 0, gastos: 0 };
    }

    // Acumular según tipo de transacción
    if (transaction.type === TransactionType.INCOME) {
      monthlyData[monthKey].ingresos += transaction.amount;
    } else {
      monthlyData[monthKey].gastos += transaction.amount;
    }
  });

  // Convertir a array y ordenar cronológicamente
  return Object.entries(monthlyData)
    .map(([month, data]) => ({ name: month, ...data }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-6); // Últimos 6 meses
};

/**
 * Agrupa transacciones de gastos por categoría y calcula totales
 * 
 * @param transactions - Array de transacciones a procesar
 * @returns Array de ExpenseCategory ordenado por monto descendente (top 6)
 * 
 * @example
 * const transactions = [
 *   { type: TransactionType.EXPENSE, category: 'Alimentos', amount: 500 },
 *   { type: TransactionType.EXPENSE, category: 'Servicios', amount: 200 },
 *   { type: TransactionType.INCOME, category: 'Ventas', amount: 1000 }
 * ];
 * const result = mapTransactionsToExpenseCategories(transactions);
 * // Returns: [
 * //   { name: 'Alimentos', value: 500 },
 * //   { name: 'Servicios', value: 200 }
 * // ]
 */
export const mapTransactionsToExpenseCategories = (transactions: Transaction[]): ExpenseCategory[] => {
  // Objeto para acumular totales por categoría
  const categoryTotals: Record<string, number> = {};

  // Filtrar solo gastos y agrupar por categoría
  transactions
    .filter(transaction => transaction.type === TransactionType.EXPENSE)
    .forEach(transaction => {
      // Usar 'Sin categorizar' como fallback para categorías vacías
      const category = transaction.category || 'Sin categorizar';
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
    });

  // Convertir a array y ordenar por monto descendente
  return Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 categorías
};