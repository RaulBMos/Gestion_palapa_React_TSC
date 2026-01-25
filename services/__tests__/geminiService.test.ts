/**
 * Pruebas unitarias exhaustivas para geminiService.ts
 * Cubre casos de éxito, error y datos vacíos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeBusinessData } from '../geminiService';
import { Transaction, TransactionType, Reservation, ReservationStatus, PaymentMethod } from '../../types';

// Mock global de fetch
global.fetch = vi.fn();

// Mock global de import.meta.env
vi.stubEnv('VITE_SERVER_URL', 'http://localhost:3001');

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((val: string) => val), // Mock simple que retorna el valor sin cambios
  },
}));

describe('geminiService', () => {
  // Datos de prueba consistentes
  const mockTransactions: Transaction[] = [
    {
      id: 't1',
      date: '2024-01-15',
      amount: 1000,
      type: TransactionType.INCOME,
      category: 'Renta',
      description: 'Reserva 1',
      paymentMethod: PaymentMethod.TRANSFER,
    },
    {
      id: 't2',
      date: '2024-01-16',
      amount: 200,
      type: TransactionType.EXPENSE,
      category: 'Mantenimiento',
      description: 'Limpieza',
      paymentMethod: PaymentMethod.CASH,
    },
    {
      id: 't3',
      date: '2024-01-25',
      amount: 500,
      type: TransactionType.EXPENSE,
      category: 'Servicios',
      description: 'Internet',
      paymentMethod: PaymentMethod.TRANSFER,
    },
    {
      id: 't4',
      date: '2024-02-10',
      amount: 2000,
      type: TransactionType.INCOME,
      category: 'Renta',
      description: 'Reserva Febrero',
      paymentMethod: PaymentMethod.TRANSFER,
    },
  ];

  const mockReservations: Reservation[] = [
    {
      id: 'r1',
      clientId: 'c1',
      cabinCount: 1,
      startDate: '2024-01-20',
      endDate: '2024-01-25',
      adults: 2,
      children: 0,
      totalAmount: 1000,
      status: ReservationStatus.CONFIRMED,
    },
    {
      id: 'r2',
      clientId: 'c2',
      cabinCount: 2,
      startDate: '2024-01-20',
      endDate: '2024-01-25',
      adults: 4,
      children: 2,
      totalAmount: 2000,
      status: ReservationStatus.CONFIRMED,
    },
    {
      id: 'r3',
      clientId: 'c3',
      cabinCount: 1,
      startDate: '2024-01-05',
      endDate: '2024-01-08',
      adults: 2,
      children: 0,
      totalAmount: 600,
      status: ReservationStatus.INFORMATION,
    },
    {
      id: 'r4',
      clientId: 'c4',
      cabinCount: 1,
      startDate: '2024-01-12',
      endDate: '2024-01-14',
      adults: 2,
      children: 1,
      totalAmount: 800,
      status: ReservationStatus.CANCELLED,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mockear import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_SERVER_URL: 'http://localhost:3001'
        }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeBusinessData', () => {
    it('should return error when both transactions and reservations are empty', async () => {
      const result = await analyzeBusinessData([], []);

      expect(result).toEqual({
        success: false,
        error: 'Se requieren datos para el análisis',
      });
    });

    it('should return error when transactions is not an array', async () => {
      const result = await analyzeBusinessData(null as any, mockReservations);

      expect(result).toEqual({
        success: false,
        error: 'Datos inválidos',
      });
    });

    it('should return error when reservations is not an array', async () => {
      const result = await analyzeBusinessData(mockTransactions, null as any);

      expect(result).toEqual({
        success: false,
        error: 'Datos inválidos',
      });
    });

    it('should handle successful API response', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: '# Análisis exitoso\n\nResumen financiero positivo.',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData(mockTransactions, mockReservations);

      expect(result.success).toBe(true);
      expect(result.data).toContain('Análisis exitoso');
      expect(result.sanitized).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: mockTransactions,
            reservations: mockReservations,
          }),
          signal: expect.any(AbortSignal),
        }
      );
    });

    it('should handle API error response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'Error interno del servidor',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData(mockTransactions, mockReservations);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Error interno del servidor")
    });

    it('should handle network error', async () => {
      const networkError = new Error('Failed to fetch');
      (global.fetch as any).mockRejectedValue(networkError);

      const result = await analyzeBusinessData(mockTransactions, mockReservations);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Error después de 3 intentos")
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('AbortError');
      (global.fetch as any).mockRejectedValue(timeoutError);

      const result = await analyzeBusinessData(mockTransactions, mockReservations, {
        timeoutMs: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should implement exponential backoff with retries', async () => {
      // Fallar 2 veces, exitir en la tercera
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            data: 'Success after retries',
          }),
        });

      const mockOnRetry = vi.fn();
      
      const result = await analyzeBusinessData(mockTransactions, mockReservations, {
        maxRetries: 3,
        timeoutMs: 100,
        onRetry: mockOnRetry,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('Success after retries');
      expect(mockOnRetry).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData(mockTransactions, mockReservations);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle API error without error message', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData(mockTransactions, mockReservations);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Error del servidor (400"))
    });

    it('should sanitize response data with DOMPurify', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: '<script>alert("xss")</script><p>Content</p>',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData(mockTransactions, mockReservations);

      expect(result.success).toBe(true);
      expect(result.sanitized).toBe(true);
      expect(result.data).not.toContain('<script>');
      expect(result.data).toContain('<p>Content</p>');
    });

    it('should use custom server URL from env', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            VITE_SERVER_URL: 'https://custom-server.com'
          }
        }
      });

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: 'Custom server response',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData(mockTransactions, mockReservations);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-server.com/api/analyze',
        expect.any(Object)
      );
    });

    it('should handle partial data (only transactions)', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: 'Analysis of transactions only',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData(mockTransactions, []);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analyze',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: mockTransactions,
            reservations: [],
          }),
          signal: expect.any(AbortSignal),
        }
      );
    });

    it('should handle partial data (only reservations)', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: 'Analysis of reservations only',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData([], mockReservations);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analyze',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: [],
            reservations: mockReservations,
          }),
          signal: expect.any(AbortSignal),
        }
      );
    });

    it('should handle large data payload', async () => {
      const largeTransactions = Array.from({ length: 100 }, (_, i) => ({
        id: `t${i}`,
        date: '2024-01-15',
        amount: Math.random() * 1000,
        type: TransactionType.INCOME,
        category: 'Renta',
        description: `Large transaction ${i}`,
        paymentMethod: PaymentMethod.TRANSFER,
      }));

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: 'Large data analysis complete',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await analyzeBusinessData(largeTransactions, mockReservations);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analyze',
        expect.any(Object)
      );
      
      // Verificar que el payload sea grande
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      expect(requestBody.transactions).toHaveLength(100);
    });
  });
});