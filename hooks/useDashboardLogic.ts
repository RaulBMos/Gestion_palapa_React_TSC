import { useState, useCallback, useMemo } from 'react';
import { Transaction, Reservation, MonthlyData, ExpenseCategory } from '../src/types';
import { analyzeBusinessData } from '../src/services/geminiService';
import { logError, logInfo, logWarning } from '../utils/logger';
import { 
  calculateMonthlyOccupancy, 
  calculateFinancialBalance, 
  calculateADR, 
  calculateAverageStayDuration, 
  calculateRevPAR 
} from '../utils/calculations';
import { withRetry } from '../src/utils/retry';
import { 
  mapTransactionsToMonthlyData, 
  mapTransactionsToExpenseCategories 
} from '../src/utils/transformers';

interface DashboardLogicHookReturn {
  // Estado
  aiAnalysis: string | null;
  loadingAi: boolean;
  aiError: string | null;
  retryAttempt: number;
  isAnalysisDisabled: boolean;
  countdownSeconds: number;
  showFallback: boolean;
  failureCount: number;
  isSystemDegraded: boolean;
  
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
  handleManualInput: (manualText: string) => Promise<void>;
  handleRetryAnalysis: () => void;
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
  
  // Estado para fallback
  const [showFallback, setShowFallback] = useState<boolean>(false);
  const [failureCount, setFailureCount] = useState<number>(0);
  const [isSystemDegraded, setIsSystemDegraded] = useState<boolean>(false);
  const [degradedUntil, setDegradedUntil] = useState<number>(0);

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
    return mapTransactionsToMonthlyData(transactions);
  }, [transactions]);

  // Preparar datos para gráficos - Categorías de gastos
  const expenseCategories = useMemo((): ExpenseCategory[] => {
    return mapTransactionsToExpenseCategories(transactions);
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

   // Función para verificar si el sistema está degradado
   const checkSystemDegraded = useCallback(() => {
     if (degradedUntil > 0) {
       const now = Date.now();
       if (now < degradedUntil) {
         return true; // Sistema aún degradado
       } else {
         // Tiempo de degradación expirado, resetear estado
         setIsSystemDegraded(false);
         setDegradedUntil(0);
         setFailureCount(0);
         logInfo('Sistema salió del modo degradado', {
           component: 'useDashboardLogic',
           action: 'checkSystemDegraded',
           degradedUntil: degradedUntil,
         });
       }
     }
     return false;
   }, [degradedUntil]);

   // Función para activar modo degradado
   const activateDegradedMode = useCallback(() => {
     const degradedTime = Date.now() + (5 * 60 * 1000); // 5 minutos
     setIsSystemDegraded(true);
     setDegradedUntil(degradedTime);
     setShowFallback(true);
     
     logWarning('Sistema entró en modo degradado por 5 minutos', {
       component: 'useDashboardLogic',
       action: 'activateDegradedMode',
       failureCount,
       degradedUntil: degradedTime,
     });
   }, [failureCount]);

   // Función para análisis con IA con exponential backoff
   const handleAiAnalysis = useCallback(async () => {
     if (isAnalysisDisabled || loadingAi) return;
     
     // Verificar si el sistema está degradado
     if (checkSystemDegraded()) {
       logInfo('Sistema degradado, usando fallback automáticamente', {
         component: 'useDashboardLogic',
         action: 'handleAiAnalysis',
         isSystemDegraded: true,
         degradedUntil,
       });
       setShowFallback(true);
       return;
     }
     
     logInfo('Usuario inició análisis de IA', {
       component: 'useDashboardLogic',
       action: 'handleAiAnalysis',
       transactionsCount: transactions.length,
       reservationsCount: reservations.length,
       currentRetryAttempt: retryAttempt,
       failureCount,
       isSystemDegraded,
     });

     setLoadingAi(true);
     setAiError(null);

     try {
       const retryResult = await withRetry(
         () => analyzeBusinessData(transactions, reservations, {
           maxRetries: 1, // Reducimos los reintentos individuales porque ya usamos withRetry
           timeoutMs: 20000
         }),
         {
           maxAttempts: 3,
           baseDelay: 1000,
           maxDelay: 10000,
           backoffFactor: 2,
           onRetry: (attempt, error, delay) => {
             logInfo(`Reintentando análisis de IA (intentos ${attempt}/3)`, {
               component: 'useDashboardLogic',
               action: 'handleAiAnalysis',
               retryAttempt: attempt,
               error: error.message,
               delay,
             });
           }
         }
       );
       
       if (retryResult.success && retryResult.data?.success && retryResult.data.data) {
         setAiAnalysis(retryResult.data.data);
         setRetryAttempt(0);
         setFailureCount(0); // Resetear contador de fallos en éxito
         
         logInfo('Análisis de IA completado exitosamente', {
           component: 'useDashboardLogic',
           action: 'handleAiAnalysis',
           success: true,
           sanitized: retryResult.data.sanitized,
           analysisLength: retryResult.data.data.length,
           attempts: retryResult.attempts,
           totalDelay: retryResult.totalDelay,
           failureCount: 0, // Reset
         });
         
         // Iniciar countdown después de análisis exitoso
         startCountdown();
       } else {
         throw new Error(retryResult.data?.error || retryResult.error?.message || 'No se recibió respuesta del servicio de IA');
       }
     } catch (error) {
       const newFailureCount = failureCount + 1;
       setFailureCount(newFailureCount);

       logError(error instanceof Error ? error : new Error('Unknown error in AI analysis'), {
         component: 'useDashboardLogic',
         action: 'handleAiAnalysis',
         failureCount: newFailureCount,
         maxFailures: 3,
         willActivateDegradedMode: newFailureCount >= 3,
       });

       if (newFailureCount >= 3) {
         // Activar modo degradado después de 3 fallos consecutivos
         activateDegradedMode();
         setAiError(error instanceof Error ? error.message : 'Error desconocido');
       } else {
         setRetryAttempt(retryAttempt + 1);
         setAiError(error instanceof Error ? error.message : 'Error desconocido');
       }
     } finally {
       setLoadingAi(false);
     }
   }, [transactions, reservations, totalAvailableCabins, retryAttempt, loadingAi, isAnalysisDisabled, startCountdown, failureCount, checkSystemDegraded, activateDegradedMode]);

   // Función para cancelar análisis
  const handleCancelAiAnalysis = useCallback(() => {
    logInfo('Usuario canceló análisis de IA', {
      component: 'useDashboardLogic',
      action: 'handleCancelAiAnalysis',
      wasLoading: loadingAi,
    });

    setLoadingAi(false);
    setAiError('Análisis cancelado por el usuario');
  }, [loadingAi]);

   // Función para limpiar error
   const clearAiError = useCallback(() => {
     logInfo('Usuario limpió error de análisis', {
       component: 'useDashboardLogic',
       action: 'clearAiError',
       hadError: !!aiError,
       hadAnalysis: !!aiAnalysis,
       retryAttempt,
       failureCount,
       isSystemDegraded,
     });

     setAiError(null);
     setAiAnalysis(null);
     setRetryAttempt(0);
     setFailureCount(0);
     setShowFallback(false);
     setIsSystemDegraded(false);
     setDegradedUntil(0);
   }, [aiError, aiAnalysis, retryAttempt, failureCount, isSystemDegraded]);

   // Función para manejar entrada manual
   const handleManualInput = useCallback(async (manualText: string) => {
     logInfo('Usuario proporcionó análisis manual', {
       component: 'useDashboardLogic',
       action: 'handleManualInput',
       textLength: manualText.length,
     });

     setAiAnalysis(manualText);
     setAiError(null);
     setRetryAttempt(0);
     setFailureCount(0);
     setShowFallback(false);
     setIsSystemDegraded(false);
     setDegradedUntil(0);
     
     // Iniciar countdown después de análisis manual exitoso
     startCountdown();
   }, [startCountdown]);

   // Función para reintentar análisis
   const handleRetryAnalysis = useCallback(() => {
     logInfo('Usuario solicitó reintentar análisis', {
       component: 'useDashboardLogic',
       action: 'handleRetryAnalysis',
       currentRetryAttempt: retryAttempt,
       failureCount,
       isSystemDegraded,
     });

     setShowFallback(false);
     setAiError(null);
     setRetryAttempt(0);
     setFailureCount(0);
     setIsSystemDegraded(false);
     setDegradedUntil(0);
     
     // Iniciar análisis automáticamente
     handleAiAnalysis();
   }, [retryAttempt, failureCount, isSystemDegraded, handleAiAnalysis]);

    return {
      // Estado
      aiAnalysis,
      loadingAi,
      aiError,
      retryAttempt,
      isAnalysisDisabled,
      countdownSeconds,
      showFallback,
      failureCount,
      isSystemDegraded,
      
      // Datos calculados
      financialBalance,
      kpiData,
      dataByMonth,
      expenseCategories,
      
      // Acciones
      handleAiAnalysis,
      handleCancelAiAnalysis,
      clearAiError,
      handleManualInput,
      handleRetryAnalysis,
    };
};