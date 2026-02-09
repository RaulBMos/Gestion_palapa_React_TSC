import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDashboardLogic } from '@/hooks/useDashboardLogic';
import { Transaction, Reservation, TransactionType, PaymentMethod, ReservationStatus } from '@/types';

// Mock del servicio de Gemini
vi.mock('@/services/geminiService', () => ({
  analyzeBusinessData: vi.fn(),
}));

// Mock del logger (con __esModule para preservar exports nombrados)
vi.mock('@/utils/logger', () => {
  const logError = vi.fn();
  const logWarning = vi.fn();
  const logInfo = vi.fn();
  const logDebug = vi.fn();
  const logger = {
    error: logError,
    warn: logWarning,
    info: logInfo,
    debug: logDebug,
  };

  return {
    __esModule: true,
    logger,
    logError,
    logWarning,
    logInfo,
    logDebug,
  };
});

// Mock de funciones de cálculo
vi.mock('@/utils/calculations', () => ({
  calculateMonthlyOccupancy: vi.fn(() => 75),
  calculateADR: vi.fn(() => 150),
  calculateAverageStayDuration: vi.fn(() => 3.5),
  calculateRevPAR: vi.fn(() => 112.5),
  calculateFinancialBalance: vi.fn(() => ({
    totalIncome: 1000,
    totalExpenses: 600,
    netProfit: 400,
    profitMargin: 40,
  })),
}));

vi.mock('@/utils/transformers', () => ({
  mapTransactionsToMonthlyData: vi.fn(() => []),
  mapTransactionsToExpenseCategories: vi.fn(() => []),
}));

// Importar los mocks después de su declaración
import { analyzeBusinessData } from '@/services/geminiService';
import { logError, logInfo, logWarning, logDebug } from '@/utils/logger';

describe('useDashboardLogic', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: TransactionType.INCOME,
      amount: 100,
      description: 'Test income',
      date: '2024-01-01',
      category: 'rental',
      paymentMethod: PaymentMethod.CASH,
    },
  ];

  const mockReservations: Reservation[] = [
    {
      id: '1',
      clientId: 'client-1',
      cabinCount: 1,
      startDate: '2024-01-01',
      endDate: '2024-01-03',
      adults: 2,
      children: 0,
      totalAmount: 200,
      status: ReservationStatus.CONFIRMED,
    },
  ];

  const totalCabins = 5;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(analyzeBusinessData).mockReset();
    vi.mocked(logError).mockReset();
    vi.mocked(logInfo).mockReset();
    vi.mocked(logWarning).mockReset();
    vi.mocked(logDebug).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1) Inicialización correcta', () => {
    it('debería inicializar con valores por defecto', () => {
      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      // Estados iniciales
      expect(result.current.aiAnalysis).toBe(null);
      expect(result.current.loadingAi).toBe(false);
      expect(result.current.aiError).toBe(null);
      expect(result.current.retryAttempt).toBe(0);
      expect(result.current.failureCount).toBe(0);
      expect(result.current.isSystemDegraded).toBe(false);
      expect(result.current.isAnalysisDisabled).toBe(false);
      expect(result.current.countdownSeconds).toBe(0);
      expect(result.current.showFallback).toBe(false);

      // Datos calculados deberían estar presentes
      expect(result.current.financialBalance).toBeDefined();
      expect(result.current.kpiData).toBeDefined();
      expect(result.current.dataByMonth).toBeDefined();
      expect(result.current.expenseCategories).toBeDefined();
    });

    it('debería calcular KPIs correctamente', () => {
      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      expect(result.current.kpiData.occupancyRate).toBe('75');
      expect(result.current.kpiData.adr).toBe('150');
      expect(result.current.kpiData.avgStayDuration).toBe('3.5');
      expect(result.current.kpiData.revPar).toBe('113'); // rounded
    });

    it('debería calcular balance financiero', () => {
      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      expect(result.current.financialBalance.totalIncome).toBe(1000);
      expect(result.current.financialBalance.totalExpenses).toBe(600);
      expect(result.current.financialBalance.netProfit).toBe(400);
      expect(result.current.financialBalance.profitMargin).toBe(40);
    });
  });

  describe('2) Manejo de errores de la API', () => {
    it('debería manejar error simple de la API', async () => {
      const mockError = new Error('API Error');
      vi.mocked(analyzeBusinessData).mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      await act(async () => {
        await result.current.handleAiAnalysis();
      });

      await vi.waitFor(() => {
        expect(vi.mocked(analyzeBusinessData)).toHaveBeenCalled();
      });

      expect(result.current.loadingAi).toBe(false);
      expect(result.current.aiError).toBe('API Error');
      expect(result.current.failureCount).toBe(1);
      expect(result.current.retryAttempt).toBe(1);
      expect(result.current.showFallback).toBe(false);
      expect(result.current.isSystemDegraded).toBe(false);
    });

    it('debería resetear contadores en análisis exitoso', async () => {
      // Primer fallo
      vi.mocked(analyzeBusinessData).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      // Primer intento fallido
      await act(async () => {
        await result.current.handleAiAnalysis();
      });

      expect(result.current.failureCount).toBe(1);

      // Segundo intento exitoso
      vi.mocked(analyzeBusinessData).mockResolvedValueOnce({
        success: true,
        data: 'Test analysis',
      });

      await act(async () => {
        await result.current.handleAiAnalysis();
      });

      await vi.waitFor(() => {
        expect(result.current.loadingAi).toBe(false);
        expect(vi.mocked(analyzeBusinessData)).toHaveBeenCalledTimes(2);
      });

      expect(result.current.failureCount).toBe(0);
      expect(result.current.retryAttempt).toBe(0);
      expect(result.current.aiAnalysis).toBe('Test analysis');
      expect(result.current.aiError).toBe(null);
    });

    it('debería limpiar error correctamente', () => {
      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      // Establecer un estado de error
      act(() => {
        result.current.clearAiError();
      });

      expect(result.current.aiError).toBe(null);
      expect(result.current.aiAnalysis).toBe(null);
      expect(result.current.retryAttempt).toBe(0);
      expect(result.current.failureCount).toBe(0);
      expect(result.current.showFallback).toBe(false);
      expect(result.current.isSystemDegraded).toBe(false);
    });
  });

  describe('3) Activación de System degradation mode', () => {
    it('debería activar modo degradado tras 3 fallos consecutivos', async () => {
      const mockError = new Error('Persistent API Error');
      vi.mocked(analyzeBusinessData).mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      // Simular 3 fallos consecutivos
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.handleAiAnalysis();
        });
      }

      await vi.waitFor(() => {
        expect(result.current.failureCount).toBe(3);
        expect(result.current.isSystemDegraded).toBe(true);
        expect(result.current.showFallback).toBe(true);
        expect(result.current.aiError).toBe('Persistent API Error');
        expect(vi.mocked(analyzeBusinessData)).toHaveBeenCalledTimes(3);
      });

      // Verificar que se activó el modo degradado por 5 minutos
      expect(vi.mocked(logWarning)).toHaveBeenCalledWith(
        'Sistema entró en modo degradado por 5 minutos',
        expect.objectContaining({
          component: 'useDashboardLogic',
          action: 'activateDegradedMode',
        })
      );
    });

    it('no debería llamar a API cuando está en modo degradado', async () => {
      // Primero activar modo degradado
      const mockError = new Error('API Error');
      vi.mocked(analyzeBusinessData).mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      // Activar modo degradado
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.handleAiAnalysis();
        });
      }

      await vi.waitFor(() => {
        expect(result.current.isSystemDegraded).toBe(true);
        expect(vi.mocked(analyzeBusinessData)).toHaveBeenCalledTimes(3);
      });

      expect(result.current.isSystemDegraded).toBe(true);

      // Resetear mock para contar nuevas llamadas
      vi.mocked(analyzeBusinessData).mockClear();

      // Intentar nuevo análisis (no debería llamar a API)
      await act(async () => {
        await result.current.handleAiAnalysis();
      });

      expect(vi.mocked(analyzeBusinessData)).not.toHaveBeenCalled();
      expect(result.current.showFallback).toBe(true);
    });

    it('debería salir del modo degradado después de 5 minutos', async () => {
      const mockError = new Error('API Error');
      vi.mocked(analyzeBusinessData).mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      // Activar modo degradado
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.handleAiAnalysis();
        });
      }

      expect(result.current.isSystemDegraded).toBe(true);

      // Avanzar el tiempo 5 minutos + 1 segundo
      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      });

      // Intentar nuevo análisis (debería salir del modo degradado)
      vi.mocked(analyzeBusinessData).mockResolvedValueOnce({
        success: true,
        data: 'Test analysis after recovery',
      });

      await act(async () => {
        await result.current.handleAiAnalysis();
      });

      await vi.waitFor(() => {
        expect(result.current.isSystemDegraded).toBe(false);
      });

      expect(result.current.isSystemDegraded).toBe(false);
      expect(result.current.failureCount).toBe(0);
      expect(result.current.aiAnalysis).toBe('Test analysis after recovery');
    });

    it('debería resetear modo degradado en retry manual', async () => {
      const mockError = new Error('API Error');
      vi.mocked(analyzeBusinessData).mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      // Activar modo degradado
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.handleAiAnalysis();
        });
      }

      expect(result.current.isSystemDegraded).toBe(true);

      // Retry manual debería resetear todo
      vi.mocked(analyzeBusinessData).mockResolvedValueOnce({
        success: true,
        data: 'Test analysis after retry',
      });

      await act(async () => {
        result.current.handleRetryAnalysis();
      });

      expect(result.current.isSystemDegraded).toBe(false);
      expect(result.current.failureCount).toBe(0);
      expect(result.current.showFallback).toBe(false);
      expect(result.current.aiError).toBe(null);
    });
  });

  describe('Funciones adicionales', () => {
    it('debería manejar entrada manual correctamente', async () => {
      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      const manualText = 'Este es un análisis manual';

      await act(async () => {
        await result.current.handleManualInput(manualText);
      });

      expect(result.current.aiAnalysis).toBe(manualText);
      expect(result.current.aiError).toBe(null);
      expect(result.current.failureCount).toBe(0);
      expect(result.current.showFallback).toBe(false);
      expect(result.current.isSystemDegraded).toBe(false);
    });

    it('debería cancelar análisis correctamente', async () => {
      const { result } = renderHook(() =>
        useDashboardLogic(mockTransactions, mockReservations, totalCabins)
      );

      act(() => {
        result.current.handleCancelAiAnalysis();
      });

      expect(result.current.loadingAi).toBe(false);
      expect(result.current.aiError).toBe('Análisis cancelado por el usuario');
    });
  });
});
