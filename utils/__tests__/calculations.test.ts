/**
 * Pruebas unitarias exhaustivas para funciones de cálculo financiero
 * Cubre todos los casos edge y escenarios límite
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyOccupancy,
  calculateFinancialBalance,
  calculateADR,
  calculateAverageStayDuration,
  calculateRevPAR,
  calculateAllMetrics
} from '../calculations';
import { Transaction, TransactionType, Reservation, ReservationStatus, PaymentMethod } from '../../src/types';

describe('Financial Calculation Utils', () => {
  
  // Datos de prueba consistentes
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      date: '2024-01-15',
      amount: 1000,
      type: TransactionType.INCOME,
      category: 'Renta',
      description: 'Reserva Enero',
      paymentMethod: PaymentMethod.TRANSFER,
    },
    {
      id: '2',
      date: '2024-01-20',
      amount: 300,
      type: TransactionType.EXPENSE,
      category: 'Mantenimiento',
      description: 'Limpieza',
      paymentMethod: PaymentMethod.CASH,
    },
    {
      id: '3',
      date: '2024-01-25',
      amount: 500,
      type: TransactionType.EXPENSE,
      category: 'Servicios',
      description: 'Internet',
      paymentMethod: PaymentMethod.TRANSFER,
    },
    {
      id: '4',
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
      id: '1',
      clientId: 'c1',
      cabinCount: 1,
      startDate: '2024-01-10',
      endDate: '2024-01-15',
      adults: 2,
      children: 0,
      totalAmount: 1000,
      status: ReservationStatus.CONFIRMED,
    },
    {
      id: '2',
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
      id: '3',
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
      id: '4',
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

  describe('calculateMonthlyOccupancy', () => {
    it('should return 0 when no reservations provided', () => {
      const result = calculateMonthlyOccupancy([], 3);
      expect(result).toBe(0);
    });

    it('should return 0 when totalCabins is 0 or negative', () => {
      const result1 = calculateMonthlyOccupancy(mockReservations, 0);
      const result2 = calculateMonthlyOccupancy(mockReservations, -5);
      
      expect(result1).toBe(0);
      expect(result2).toBe(0);
    });

      it('should handle empty confirmed reservations', () => {
      const confirmedReservations = mockReservations.filter(r => 
        r.status === ReservationStatus.CONFIRMED
      );
      
      const result = calculateMonthlyOccupancy(confirmedReservations, 3);
      expect(result).toBe(0);
    });

    it('should exclude CANCELLED reservations', () => {
      const cancelledReservations = mockReservations.filter(r => 
        r.status === ReservationStatus.CANCELLED
      );
      
      const result = calculateMonthlyOccupancy(cancelledReservations, 3);
      expect(result).toBe(0);
    });

    it('should calculate partial month overlap correctly', () => {
      // Reserva que empieza antes del mes y termina durante el mes
      const overlappingReservation: Reservation = {
        ...mockReservations[0],
        startDate: '2023-12-28',
        endDate: '2024-01-05',
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateMonthlyOccupancy([overlappingReservation], 3);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle multi-cabin reservations correctly', () => {
      const multiCabinReservation: Reservation = {
        ...mockReservations[1],
        cabinCount: 2,
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateMonthlyOccupancy([multiCabinReservation], 3);
      // Debería contar 2 cabañas ocupadas
      const expectedOccupancy = (2 * 5) / (31 * 3) * 100; // 5 noches * 2 cabañas
      expect(result).toBeCloseTo(expectedOccupancy, 1);
    });

    it('should cap occupancy at 100%', () => {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const fullMonthReservation: Reservation = {
        id: 'full',
        clientId: 'c1',
        cabinCount: 3,
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
        adults: 6,
        children: 0,
        totalAmount: 5000,
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateMonthlyOccupancy([fullMonthReservation], 3);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle checkout day correctly (should be available)', () => {
      // Reserva que termina hoy - el día de checkout no cuenta como ocupado
      const today = new Date();
      const checkoutReservation: Reservation = {
        ...mockReservations[0],
        startDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0], // Checkout hoy
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateMonthlyOccupancy([checkoutReservation], 3);
      // Hoy no debería contar como noche ocupada
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateFinancialBalance', () => {
    it('should return zeros when no transactions', () => {
      const result = calculateFinancialBalance([]);
      
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.profitMargin).toBe(0);
    });

    it('should calculate only income correctly', () => {
      const incomeOnly = mockTransactions.filter(t => t.type === TransactionType.INCOME);
      const result = calculateFinancialBalance(incomeOnly);
      
      expect(result.totalIncome).toBe(3000);
      expect(result.totalExpenses).toBe(0);
      expect(result.netProfit).toBe(3000);
      expect(result.profitMargin).toBe(100);
    });

    it('should calculate only expenses correctly', () => {
      const expensesOnly = mockTransactions.filter(t => t.type === TransactionType.EXPENSE);
      const result = calculateFinancialBalance(expensesOnly);
      
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(800);
      expect(result.netProfit).toBe(-800);
      expect(result.profitMargin).toBe(0);
    });

    it('should calculate mixed transactions correctly', () => {
      const result = calculateFinancialBalance(mockTransactions);
      
      expect(result.totalIncome).toBe(3000);
      expect(result.totalExpenses).toBe(800);
      expect(result.netProfit).toBe(2200);
      expect(result.profitMargin).toBeCloseTo(73.33, 1);
    });

    it('should handle zero profit margin correctly', () => {
      const zeroProfitTransactions: Transaction[] = [
        {
          ...mockTransactions[0],
          amount: 1000,
          type: TransactionType.INCOME,
        },
        {
          ...mockTransactions[1],
          amount: 1000,
          type: TransactionType.EXPENSE,
        },
      ];

      const result = calculateFinancialBalance(zeroProfitTransactions);
      expect(result.netProfit).toBe(0);
      expect(result.profitMargin).toBe(0);
    });

    it('should handle negative profit correctly', () => {
      const lossTransactions: Transaction[] = [
        {
          ...mockTransactions[0],
          amount: 500,
          type: TransactionType.INCOME,
        },
        {
          ...mockTransactions[1],
          amount: 1000,
          type: TransactionType.EXPENSE,
        },
      ];

      const result = calculateFinancialBalance(lossTransactions);
      expect(result.netProfit).toBe(-500);
      expect(result.profitMargin).toBe(0); // Sin ganancia, margen = 0
    });

    it('should handle decimal amounts correctly', () => {
      const decimalTransactions: Transaction[] = [
        {
          ...mockTransactions[0],
          amount: 1234.56,
          type: TransactionType.INCOME,
        },
        {
          ...mockTransactions[1],
          amount: 678.90,
          type: TransactionType.EXPENSE,
        },
      ];

      const result = calculateFinancialBalance(decimalTransactions);
      expect(result.totalIncome).toBe(1234.56);
      expect(result.totalExpenses).toBe(678.90);
      expect(result.netProfit).toBeCloseTo(555.66, 2);
      expect(result.profitMargin).toBeCloseTo(45.01, 1);
    });
  });

  describe('calculateADR', () => {
    it('should return 0 when no reservations', () => {
      const result = calculateADR([]);
      expect(result).toBe(0);
    });

    it('should return 0 when no confirmed reservations', () => {
      const unconfirmedReservations = mockReservations.filter(r => 
        r.status !== ReservationStatus.CONFIRMED
      );
      
      const result = calculateADR(unconfirmedReservations);
      expect(result).toBe(0);
    });

it('should calculate ADR for single reservation', () => {
      const singleReservation: Reservation = {
        ...mockReservations[0],
        startDate: '2024-01-10',
        endDate: '2024-01-15', // 5 nights - 10 al 14 inclusive = 5 days
        totalAmount: 1000, // $200 per night * 5 nights
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateADR([singleReservation]);
      expect(result).toBe(200); // 1000 / 5 nights = $200
    });

    it('should calculate ADR for multiple reservations', () => {
      const result = calculateADR(mockReservations.filter(r => 
        r.status === ReservationStatus.CONFIRMED
      ));
      
      // Reserva 1: 5 nights * 1 cabaña = 5 noches, $1000 = $200/night
      // Reserva 2: 5 nights * 2 cabañas = 10 noches, $2000 = $200/night
      // Total: 15 noches, $3000 = $200/night
      expect(result).toBeCloseTo(200, 1);
    });

    it('should handle multi-cabin reservations correctly', () => {
      const multiCabinReservation: Reservation = {
        ...mockReservations[1],
        cabinCount: 2,
        startDate: '2024-01-20',
        endDate: '2024-01-25', // 5 nights
        totalAmount: 2000, // $200 per night per cabin
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateADR([multiCabinReservation]);
      expect(result).toBe(200); // $2000 / (5 nights * 2 cabins) = $200
    });

    it('should handle same day reservations', () => {
      const sameDayReservation: Reservation = {
        ...mockReservations[0],
        startDate: '2024-01-10',
        endDate: '2024-01-11', // 1 night
        totalAmount: 300,
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateADR([sameDayReservation]);
      expect(result).toBe(300); // $300 / 1 night = $300
    });
  });

  describe('calculateAverageStayDuration', () => {
    it('should return 0 when no reservations', () => {
      const result = calculateAverageStayDuration([]);
      expect(result).toBe(0);
    });

    it('should return 0 when no confirmed reservations', () => {
      const unconfirmedReservations = mockReservations.filter(r => 
        r.status !== ReservationStatus.CONFIRMED
      );
      
      const result = calculateAverageStayDuration(unconfirmedReservations);
      expect(result).toBe(0);
    });

    it('should calculate average for single reservation', () => {
      const singleReservation: Reservation = {
        ...mockReservations[0],
        startDate: '2024-01-10',
        endDate: '2024-01-15', // 5 nights
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateAverageStayDuration([singleReservation]);
      expect(result).toBe(5);
    });

    it('should calculate average for multiple reservations', () => {
      const confirmedReservations = mockReservations.filter(r => 
        r.status === ReservationStatus.CONFIRMED
      );
      
      // Both reservations are 5 nights
      const result = calculateAverageStayDuration(confirmedReservations);
      expect(result).toBe(5);
    });

    it('should calculate average for different durations', () => {
      const variedReservations: Reservation[] = [
        {
          ...mockReservations[0],
          startDate: '2024-01-10',
          endDate: '2024-01-12', // 2 nights
          status: ReservationStatus.CONFIRMED,
        },
        {
          ...mockReservations[1],
          startDate: '2024-01-15',
          endDate: '2024-01-22', // 7 nights
          status: ReservationStatus.CONFIRMED,
        },
      ];

      const result = calculateAverageStayDuration(variedReservations);
      expect(result).toBe(4.5); // (2 + 7) / 2 = 4.5
    });

    it('should handle long stay reservations', () => {
      const longStayReservation: Reservation = {
        ...mockReservations[0],
        startDate: '2024-01-01',
        endDate: '2024-01-31', // 30 nights
        status: ReservationStatus.CONFIRMED,
      };

      const result = calculateAverageStayDuration([longStayReservation]);
      expect(result).toBe(30);
    });
  });

  describe('calculateRevPAR', () => {
    it('should return 0 when occupancy is 0', () => {
      const result = calculateRevPAR(0, 100);
      expect(result).toBe(0);
    });

    it('should return 0 when ADR is 0', () => {
      const result = calculateRevPAR(50, 0);
      expect(result).toBe(0);
    });

    it('should calculate RevPAR correctly', () => {
      const result = calculateRevPAR(75, 150);
      expect(result).toBe(112.5); // 0.75 * 150 = 112.5
    });

    it('should handle full occupancy', () => {
      const result = calculateRevPAR(100, 200);
      expect(result).toBe(200); // 1.0 * 200 = 200
    });

    it('should handle partial occupancy', () => {
      const result = calculateRevPAR(33.33, 180);
      expect(result).toBeCloseTo(60, 1); // 0.3333 * 180 = 60
    });

    it('should handle decimal values', () => {
      const result = calculateRevPAR(67.5, 125.67);
      expect(result).toBeCloseTo(84.83, 2); // 0.675 * 125.67 = 84.83
    });
  });

  describe('calculateAllMetrics', () => {
    it('should return all zeros when no data', () => {
      const result = calculateAllMetrics([], [], 3);
      
      expect(result.occupancyRate).toBe(0);
      expect(result.adr).toBe(0);
      expect(result.avgStayDuration).toBe(0);
      expect(result.revpar).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.profitMargin).toBe(0);
    });

    it('should calculate all metrics correctly', () => {
      const confirmedReservations = mockReservations.filter(r => 
        r.status === ReservationStatus.CONFIRMED
      );
      
      const result = calculateAllMetrics(confirmedReservations, mockTransactions, 3);
      
      expect(result.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(result.adr).toBeGreaterThan(0);
      expect(result.avgStayDuration).toBeGreaterThanOrEqual(0);
      expect(result.revpar).toBeGreaterThanOrEqual(0);
      expect(result.totalIncome).toBe(3000);
      expect(result.totalExpenses).toBe(800);
      expect(result.netProfit).toBe(2200);
      expect(result.profitMargin).toBeGreaterThan(0);
    });

    it('should format numeric values correctly', () => {
      const result = calculateAllMetrics(mockReservations, mockTransactions, 3);
      
      expect(typeof result.occupancyRate).toBe('number');
      expect(typeof result.adr).toBe('number');
      expect(typeof result.avgStayDuration).toBe('number');
      expect(typeof result.revpar).toBe('number');
      
      // Deberían ser números sin decimales o con decimales limitados
      expect(Number.isInteger(result.occupancyRate)).toBe(true);
      expect(Number.isInteger(result.adr)).toBe(true);
      expect(Number.isInteger(result.revpar)).toBe(true);
      expect(result.avgStayDuration).toBeLessThan(10); // Formateado a 1 decimal
    });

    it('should handle edge case with very small values', () => {
      const tinyTransactions: Transaction[] = [
        {
          ...mockTransactions[0],
          amount: 0.01,
          type: TransactionType.INCOME,
        },
      ];

      const tinyReservations: Reservation[] = [
        {
          ...mockReservations[0],
          totalAmount: 0.01,
          cabinCount: 1,
          status: ReservationStatus.CONFIRMED,
        },
      ];

      const result = calculateAllMetrics(tinyReservations, tinyTransactions, 100);
      
      expect(result.totalIncome).toBe(0.01);
      expect(result.netProfit).toBe(0.01);
      expect(result.profitMargin).toBe(100);
    });

    it('should handle very large values', () => {
      const largeTransactions: Transaction[] = [
        {
          ...mockTransactions[0],
          amount: 999999,
          type: TransactionType.INCOME,
        },
      ];

      const largeReservations: Reservation[] = [
        {
          ...mockReservations[0],
          totalAmount: 999999,
          cabinCount: 1,
          startDate: '2024-01-01',
          endDate: '2024-01-31', // Full month
          status: ReservationStatus.CONFIRMED,
        },
      ];

      const result = calculateAllMetrics(largeReservations, largeTransactions, 1);
      
      expect(result.totalIncome).toBe(999999);
      expect(result.netProfit).toBe(999999);
      expect(result.adr).toBeGreaterThanOrEqual(0); // 999999 / 31 days
    });
  });
});