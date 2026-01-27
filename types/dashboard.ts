

// Interfaces tipadas para datos del dashboard
export interface MonthlyData {
  name: string;
  ingresos: number;
  gastos: number;
}

export interface ExpenseCategory {
  name: string;
  value: number;
}

export interface FinancialData {
  ingresos: number;
  gastos: number;
  netProfit: number;
  profitMargin: number;
}