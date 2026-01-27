/**
 * Utilidades de cálculo para operaciones financieras y ocupación
 * Exporta funciones puras para fácil testing
 */

import { Reservation, ReservationStatus, Transaction, TransactionType } from '../src/types';

/**
 * Calcula la ocupación mensual actual
 * 
 * @param reservations - Array de reservaciones
 * @param totalCabins - Número total de cabañas disponibles
 * @returns Porcentaje de ocupación (0-100)
 */
export const calculateMonthlyOccupancy = (
  reservations: Reservation[],
  totalCabins: number
): number => {
  if (totalCabins <= 0 || reservations.length === 0) {
    return 0;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const totalCapacityNights = daysInMonth * totalCabins;

  let occupiedNights = 0;

  reservations.forEach((res) => {
    // Exclude Cancelled and Information status
    if (
      res.status === ReservationStatus.CANCELLED ||
      res.status === ReservationStatus.INFORMATION
    ) {
      return;
    }

    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);

  // Calculate overlap with current month
    const overlapStart = resStart < startOfMonth ? startOfMonth : resStart;
    const overlapEnd = resEnd > endOfMonth ? endOfMonth : resEnd;
    
    if (overlapStart < overlapEnd) {
      // Calcular días correctamente (inclusive de start, exclusive de end)
      const diffMs = overlapEnd.getTime() - overlapStart.getTime();
      const overlapDays = Math.max(1, Math.floor(diffMs / (1000 * 3600 * 24) + 1));
      
      // Verificar que realmente solapa con el mes actual
      if (overlapStart <= endOfMonth && overlapEnd >= startOfMonth) {
        occupiedNights += overlapDays * res.cabinCount;
      }
    }
  });

  const occupancyPercentage = (occupiedNights / totalCapacityNights) * 100;
  return Math.min(100, Math.max(0, occupancyPercentage));
};

/**
 * Calcula el balance financiero total
 * 
 * @param transactions - Array de transacciones
 * @returns Objeto con ingresos, gastos y balance neto
 */
export const calculateFinancialBalance = (transactions: Transaction[]) => {
  const totalIncome = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netProfit = totalIncome - totalExpenses;
  const profitMargin =
    totalIncome > 0 && netProfit > 0 ? (netProfit / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin,
  };
};

/**
 * Calcula el Average Daily Rate (ADR) - tarifa promedio por noche
 * 
 * @param reservations - Array de reservaciones confirmadas/completadas
 * @returns ADR en moneda base
 */
export const calculateADR = (reservations: Reservation[]): number => {
  const confirmedReservations = reservations.filter(
    (r) =>
      r.status === ReservationStatus.CONFIRMED ||
      r.status === ReservationStatus.COMPLETED
  );

  if (confirmedReservations.length === 0) {
    return 0;
  }

  const totalRevenueConfirmed = confirmedReservations.reduce(
    (acc, res) => acc + res.totalAmount,
    0
  );

  let totalNightsBooked = 0;

  confirmedReservations.forEach((res) => {
    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    const duration = Math.ceil(
      (resEnd.getTime() - resStart.getTime()) / (1000 * 3600 * 24)
    );
    totalNightsBooked += duration * res.cabinCount;
  });

  return totalNightsBooked > 0 ? totalRevenueConfirmed / totalNightsBooked : 0;
};

/**
 * Calcula la duración promedio de estancia
 * 
 * @param reservations - Array de reservaciones
 * @returns Duración promedio en días
 */
export const calculateAverageStayDuration = (
  reservations: Reservation[]
): number => {
  const validReservations = reservations.filter(
    (r) =>
      r.status === ReservationStatus.CONFIRMED ||
      r.status === ReservationStatus.COMPLETED
  );

  if (validReservations.length === 0) {
    return 0;
  }

  const totalStayDuration = validReservations.reduce((acc, res) => {
    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    const duration = Math.ceil(
      (resEnd.getTime() - resStart.getTime()) / (1000 * 3600 * 24)
    );
    return acc + duration;
  }, 0);

  return totalStayDuration / validReservations.length;
};

/**
 * Calcula el Revenue Per Available Room (RevPAR)
 * 
 * @param occupancyRate - Tasa de ocupación (0-100)
 * @param adr - Average Daily Rate
 * @returns RevPAR
 */
export const calculateRevPAR = (occupancyRate: number, adr: number): number => {
  return (occupancyRate / 100) * adr;
};

/**
 * Obtiene todas las métricas KPI calculadas
 * 
 * @param reservations - Array de reservaciones
 * @param transactions - Array de transacciones
 * @param totalCabins - Número total de cabañas
 * @returns Objeto con todas las métricas
 */
export const calculateAllMetrics = (
  reservations: Reservation[],
  transactions: Transaction[],
  totalCabins: number
) => {
  const occupancyRate = calculateMonthlyOccupancy(reservations, totalCabins);
  const adr = calculateADR(reservations);
  const avgStayDuration = calculateAverageStayDuration(reservations);
  const revpar = calculateRevPAR(occupancyRate, adr);
  const financialBalance = calculateFinancialBalance(transactions);

  return {
    occupancyRate: Number(occupancyRate.toFixed(0)),
    adr: Number(adr.toFixed(0)),
    avgStayDuration: Number(avgStayDuration.toFixed(1)),
    revpar: Number(revpar.toFixed(0)),
    ...financialBalance,
  };
};
