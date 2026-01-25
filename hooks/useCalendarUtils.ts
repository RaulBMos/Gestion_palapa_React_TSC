import { useState, useCallback } from 'react';
import { useState, useCallback } from 'react';
import { useState, useCallback } from 'react';
import { useState, useCallback } from 'react';
import { useState, useCallback } from 'react';
import { DateCallback, OccupancyData, CalendarDayInfo, CalendarNewReservation, Reservation, ReservationStatus } from '../types/calendar';

interface CalendarUtilsHookReturn {
  getDateString: (date: Date) => string;
  formatDateForDisplay: (dateStr: string | undefined) => string;
  getDaysInMonth: (date: Date) => (Date | null)[];
  getOccupancy: (dateStr: string, excludeReservationId?: string) => OccupancyData;
  calculateDayInfo: (
    date: Date,
    dateStr: string,
    mode: 'main' | 'picker',
    selectedDate: string | null,
    newRes: Partial<CalendarNewReservation> | null,
    editingId: string | undefined,
    getOccupancy: (dateStr: string, excludeReservationId?: string) => OccupancyData,
    totalAvailableCabins: number
  ) => CalendarDayInfo;
}

interface CalendarUtilsHookReturn {
  getDateString: (date: Date) => string;
  formatDateForDisplay: (dateStr: string | undefined) => string;
  getDaysInMonth: (date: Date) => (Date | null)[];
  getOccupancy: (dateStr: string, excludeReservationId?: string) => OccupancyData;
  calculateDayInfo: (
    date: Date,
    dateStr: string,
    mode: 'main' | 'picker',
    selectedDate: string | null,
    newRes: Partial<CalendarNewReservation> | null,
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
  totalAvailableCabins: number
): CalendarUtilsHookReturn => {
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
    newRes: Partial<any>,
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
  }, [getOccupancy]);

  return {
    getDateString,
    formatDateForDisplay,
    getDaysInMonth,
    getOccupancy,
    calculateDayInfo
  };
};