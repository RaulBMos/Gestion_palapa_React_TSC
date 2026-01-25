import { useState, useCallback, useMemo } from 'react';
import { Transaction, Reservation, TransactionType } from '../types';
import { analyzeBusinessData } from '../services/geminiService';
import { generateLocalAnalysis } from '../utils/localAnalysis';
import { 
  calculateMonthlyOccupancy, 
  calculateFinancialBalance, 
  calculateADR, 
  calculateAverageStayDuration, 
  calculateRevPAR 
} from '../utils/calculations';
import { MonthlyData, ExpenseCategory, FinancialData } from '../types/dashboard';

interface DashboardLogicHookReturn {
  // Estado
  aiAnalysis: string | null;
  loadingAi: boolean;
  aiError: string | null;
  retryAttempt: number;
  isAnalysisDisabled: boolean;
  countdownSeconds: number;
  
  // Datos calculados
  financialBalance: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  kpiData: {
    occupancyRate: string;
    adr: string;
    avgStayDuration: string;
    revPar: string;
  };
  
  // Chart data
  dataByMonth: MonthlyData[];
  expenseCategories: ExpenseCategory[];
  
  // Acciones
  handleAiAnalysis: () => Promise<void>;
  handleCancelAiAnalysis: () => void;
  clearAiError: () => void;
}

/**
 * Hook personalizado para manejar toda la lógica de negocio del Dashboard
 * Centraliza cálculos, estado de IA y procesamiento de datos
 */
export const useDashboardLogic = (
  transactions: Transaction[],
  reservations: Reservation[],
  totalAvailableCabins: number
): DashboardLogicHookReturn => {
  // Estado para análisis de IA
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  
  // Estado para debounce y control de cuota
  const [isAnalysisDisabled, setIsAnalysisDisabled] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  // Calcular KPIs
  const kpiData = useMemo(() => {
    const occupancyRate = calculateMonthlyOccupancy(reservations, totalAvailableCabins);
    const adr = calculateADR(reservations);
    const avgStayDuration = calculateAverageStayDuration(reservations);
    const revpar = calculateRevPAR(occupancyRate, adr);

    return {
      occupancyRate: occupancyRate.toFixed(0),
      adr: adr.toFixed(0),
      avgStayDuration: avgStayDuration.toFixed(1),
      revPar: revpar.toFixed(0),
    };
  }, [reservations, totalAvailableCabins]);

  // Calcular balance financiero
  const financialBalance = useMemo(() => {
    return calculateFinancialBalance(transactions);
  }, [transactions]);

  // Preparar datos para gráficos - Resumenes mensuales
  const dataByMonth = useMemo((): MonthlyData[] => {
    const monthlyData: Record<string, { ingresos: number; gastos: number }> = {};
    
    transactions.forEach((transaction) => {
      const monthKey = new Date(transaction.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
      });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { ingresos: 0, gastos: 0 };
      }
      
      if (transaction.type === TransactionType.INCOME) {
        monthlyData[monthKey].ingresos += transaction.amount;
      } else {
        monthlyData[monthKey].gastos += transaction.amount;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ name: month, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-6);
  }, [transactions]);

  // Preparar datos para gráficos - Categorías de gastos
  const expenseCategories = useMemo((): ExpenseCategory[] => {
    const categoryTotals: Record<string, number> = {};
    
    transactions
      .filter(transaction => transaction.type === TransactionType.EXPENSE)
      .forEach(transaction => {
        const category = transaction.category || 'Sin categorizar';
        categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
      });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  // Manejador de countdown para debounce
  const startCountdown = useCallback(() => {
    setIsAnalysisDisabled(true);
    setCountdownSeconds(30);
    
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          setIsAnalysisDisabled(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Función para análisis con IA
  const handleAiAnalysis = useCallback(async () => {
    if (isAnalysisDisabled || loadingAi) return;
    
    setLoadingAi(true);
    setAiError(null);

    try {
      const result = await analyzeBusinessData(transactions, reservations, {
        maxRetries: 3,
        timeoutMs: 20000
      });
      
      if (result.success && result.data) {
        setAiAnalysis(result.data);
        setRetryAttempt(0);
        // Iniciar countdown después de análisis exitoso
        startCountdown();
      } else {
        throw new Error(result.error || 'No se recibió respuesta del servicio de IA');
      }
      
      if (result.success && result.data) {
        setAiAnalysis(result.data);
        setRetryAttempt(0);
        // Iniciar countdown después de análisis exitoso
        startCountdown();
      } else {
        throw new Error(result.error || 'No se recibió respuesta del servicio de IA');
      }
    } catch (error) {
      const newRetryAttempt = retryAttempt + 1;
      setRetryAttempt(newRetryAttempt);

      if (newRetryAttempt >= 3) {
        // Después de 3 intentos fallidos, generar análisis local
        const localAnalysis = generateLocalAnalysis(reservations, transactions, totalAvailableCabins);
        setAiAnalysis(localAnalysis);
        setAiError(null);
        setRetryAttempt(0);
      } else {
        setAiError(error instanceof Error ? error.message : 'Error desconocido');
      }
    } finally {
      setLoadingAi(false);
    }
  }, [transactions, reservations, totalAvailableCabins, retryAttempt, loadingAi, isAnalysisDisabled, startCountdown]);

  // Función para cancelar análisis
  const handleCancelAiAnalysis = useCallback(() => {
    setLoadingAi(false);
    setAiError('Análisis cancelado por el usuario');
  }, []);

  // Función para limpiar error
  const clearAiError = useCallback(() => {
    setAiError(null);
    setAiAnalysis(null);
    setRetryAttempt(0);
  }, []);

  return {
    // Estado
    aiAnalysis,
    loadingAi,
    aiError,
    retryAttempt,
    isAnalysisDisabled,
    countdownSeconds,
    
    // Datos calculados
    financialBalance,
    kpiData,
    dataByMonth,
    expenseCategories,
    
    // Acciones
    handleAiAnalysis,
    handleCancelAiAnalysis,
    clearAiError,
  };
};