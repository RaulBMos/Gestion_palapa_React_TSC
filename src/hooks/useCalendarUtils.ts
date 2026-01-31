import { useCallback } from 'react';
import {
  OccupancyData,
  CalendarDayInfo,
  Reservation,
  ReservationStatus,
  NewReservation,
  Client,
  ReservationCalendarHelpers
} from '@/types';

interface CalendarUtilsHookReturn extends ReservationCalendarHelpers {
  calculateDayInfo: (
    date: Date,
    dateStr: string,
    mode: 'main' | 'picker',
    selectedDate: string | null,
    newRes: Partial<NewReservation>,
    editingId: string | undefined,
    getOccupancy: (dateStr: string, excludeReservationId?: string) => OccupancyData,
    totalAvailableCabins: number
  ) => CalendarDayInfo;
}

/**
 * Hook personalizado con utilidades de calendario
 * Centraliza funciones de fecha, ocupación y renderizado
 */
export const useCalendarUtils = (
  reservations: Reservation[],
  _totalAvailableCabins: number
): CalendarUtilsHookReturn => {
  const getDateString = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateForDisplay = useCallback((dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (y === undefined || m === undefined || d === undefined) return '-';
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }, []);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, []);

  const getOccupancy = useCallback((dateStr: string, excludeReservationId?: string): OccupancyData => {
    const activeReservations = reservations.filter(r =>
      r.status === ReservationStatus.CONFIRMED &&
      r.id !== excludeReservationId &&
      r.startDate <= dateStr &&
      r.endDate > dateStr
    );

    const occupiedCount = activeReservations.reduce((acc, r) => acc + r.cabinCount, 0);
    return { occupiedCount, activeReservations };
  }, [reservations]);

  const calculateDayInfo = useCallback((
    date: Date,
    dateStr: string,
    mode: 'main' | 'picker',
    selectedDate: string | null,
    newRes: Partial<NewReservation>,
    editingId: string | undefined,
    getOccupancy: (dateStr: string, excludeReservationId?: string) => OccupancyData,
    totalAvailableCabins: number
  ): CalendarDayInfo => {
    const { occupiedCount, activeReservations } = getOccupancy(dateStr, editingId || undefined);
    const availableCount = Math.max(0, totalAvailableCabins - occupiedCount);

    // Selection States
    let isSelected = false;
    let isInRange = false;
    let isStart = false;
    let isEnd = false;

    if (mode === 'main') {
      isSelected = selectedDate === dateStr;
    } else {
      if (newRes.startDate === dateStr) isStart = true;
      if (newRes.endDate === dateStr) isEnd = true;
      if (newRes.startDate && newRes.endDate && dateStr > newRes.startDate && dateStr < newRes.endDate) {
        isInRange = true;
      }
    }

    // Base Availability Colors
    let bgColor = 'bg-emerald-50 hover:bg-emerald-100';
    let textColor = 'text-emerald-900';
    let borderColor = 'border-emerald-100';

    if (availableCount === 0) {
      bgColor = 'bg-red-50 hover:bg-red-100';
      textColor = 'text-red-900';
      borderColor = 'border-red-100';

      if (mode === 'picker' && !isInRange && !isStart && !isEnd) {
        textColor = 'text-red-300';
        bgColor = 'bg-red-50/50';
      }
    }
    else if (availableCount < totalAvailableCabins) {
      bgColor = 'bg-orange-50 hover:bg-orange-100';
      textColor = 'text-orange-900';
      borderColor = 'border-orange-100';
    }

    // Selection Overrides
    if (isSelected) {
      bgColor = 'bg-sky-600 text-white shadow-md z-10 scale-105';
      textColor = 'text-white';
      borderColor = 'border-sky-600';
    }
    if (isStart || isEnd) {
      bgColor = 'bg-indigo-600 text-white shadow-md z-10 scale-105';
      textColor = 'text-white';
      borderColor = 'border-indigo-600';
    }
    if (isInRange) {
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-900';
      borderColor = 'border-indigo-200';
    }

    return {
      date,
      dateStr,
      occupiedCount,
      availableCount,
      activeReservations,
      isSelected,
      isInRange,
      isStart,
      isEnd,
      bgColor,
      textColor,
      borderColor,
      isFullyOccupied: availableCount === 0,
      isPartiallyOccupied: availableCount < totalAvailableCabins && availableCount > 0
    };
  }, []);

  const getClientName = useCallback((id: string, clients: Client[]) =>
    clients.find(c => c.id === id)?.name || 'Cliente desconocido',
    []
  );

  const statusColor = useCallback((status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.CONFIRMED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case ReservationStatus.INFORMATION: return 'bg-sky-100 text-sky-700 border-sky-200';
      case ReservationStatus.COMPLETED: return 'bg-slate-100 text-slate-700 border-slate-200';
      case ReservationStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100';
    }
  }, []);

  return {
    getDateString,
    formatDateForDisplay,
    getDaysInMonth,
    getOccupancy,
    getClientName,
    statusColor,
    calculateDayInfo
  };
};