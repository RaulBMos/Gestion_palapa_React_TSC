import { useState, useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { FormEvent } from 'react';
import { Reservation, ReservationStatus, Client } from '../src/types';

interface CalendarState {
  currentMonth: Date;
  selectedDate: string | null;
  pickerMonth: Date;
}

interface FormState {
  editingId: string | null;
  showForm: boolean;
  newRes: Partial<Reservation>;
  filter: string;
  viewMode: 'list' | 'calendar';
  listTab: 'active' | 'history';
}

interface ReservationLogicHookReturn {
  // Estado
  calendarState: CalendarState;
  formState: FormState;
  
  // Estados separados para fácil acceso
  currentMonth: Date;
  selectedDate: string | null;
  pickerMonth: Date;
  editingId: string | null;
  showForm: boolean;
  newRes: Partial<Reservation>;
  filter: string;
  viewMode: 'list' | 'calendar';
  listTab: 'active' | 'history';
  
  // Funciones de ayuda
  getDateString: (date: Date) => string;
  formatDateForDisplay: (dateStr: string | undefined) => string;
  getDaysInMonth: (date: Date) => (Date | null)[];
  getOccupancy: (dateStr: string, excludeReservationId?: string) => {
    occupiedCount: number;
    activeReservations: Reservation[];
  };
  getClientName: (id: string) => string;
  statusColor: (status: ReservationStatus) => string;
  
  // Acciones
  changeMonth: (setter: Dispatch<SetStateAction<Date>>, current: Date, increment: number) => void;
  handleDateClick: (dateStr: string) => void;
  handleEditClick: (res: Reservation) => void;
  handleNewClick: () => void;
  handleSubmit: (e: FormEvent) => void;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  setFilter: Dispatch<SetStateAction<string>>;
  setViewMode: Dispatch<SetStateAction<'list' | 'calendar'>>;
  setListTab: Dispatch<SetStateAction<'active' | 'history'>>;
  setNewRes: Dispatch<SetStateAction<Partial<Reservation>>>;
  setSelectedDate: Dispatch<SetStateAction<string | null>>;
  
  // Datos calculados
  filteredReservations: Reservation[];
  selectedDateReservations: Reservation[];
}

/**
 * Hook personalizado para manejar toda la lógica de reservaciones
 * Centraliza estado del calendario, formularios, filtrado y operaciones CRUD
 */
export const useReservationLogic = (
  reservations: Reservation[],
  clients: Client[],
  _totalAvailableCabins: number,
  onAdd?: (res: Reservation) => void,
  onEdit?: (res: Reservation) => void
): ReservationLogicHookReturn => {
  // --- Calendar State ---
  const [currentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pickerMonth, setPickerMonth] = useState(new Date());

  // --- Form State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [listTab, setListTab] = useState<'active' | 'history'>('active');
  
  const [newRes, setNewRes] = useState<Partial<Reservation>>({
    status: ReservationStatus.INFORMATION,
    adults: 2,
    children: 0,
    cabinCount: 1
  });

  // --- Helper Functions ---
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

  const getOccupancy = useCallback((dateStr: string, excludeReservationId?: string) => {
    const activeReservations = reservations.filter(r => 
      r.status === ReservationStatus.CONFIRMED &&
      r.id !== excludeReservationId && 
      r.startDate <= dateStr && 
      r.endDate > dateStr
    );
    
    const occupiedCount = activeReservations.reduce((acc, r) => acc + r.cabinCount, 0);
    return { occupiedCount, activeReservations };
  }, [reservations]);

  const getClientName = useCallback((id: string) => 
    clients.find(c => c.id === id)?.name || 'Cliente desconocido', 
    [clients]
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

  // --- Navigation Logic ---
  const changeMonth = useCallback((setter: Dispatch<SetStateAction<Date>>, current: Date, increment: number) => {
    const newDate = new Date(current);
    newDate.setMonth(newDate.getMonth() + increment);
    setter(newDate);
  }, []);

  // --- Actions ---
  const handleEditClick = useCallback((res: Reservation) => {
    setNewRes({ ...res });
    setEditingId(res.id);
    if (res.startDate) {
      const [y, m, d] = res.startDate.split('-').map(Number);
      if (y !== undefined && m !== undefined && d !== undefined && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setPickerMonth(new Date(y, m - 1, 1));
      } else {
        setPickerMonth(new Date());
      }
    } else {
      setPickerMonth(new Date());
    }
    setShowForm(true);
  }, []);

  const handleNewClick = useCallback(() => {
    const today = new Date();
    const todayStr = getDateString(today);

    setNewRes({
      status: ReservationStatus.INFORMATION,
      adults: 2,
      children: 0,
      cabinCount: 1,
      totalAmount: 0,
      startDate: todayStr,
      endDate: ''
    });
    setEditingId(null);
    setPickerMonth(today);
    setShowForm(true);
  }, [getDateString]);

  const handleDateClick = useCallback((dateStr: string) => {
    let updatedRes = { ...newRes };

    if (!updatedRes.startDate || (updatedRes.startDate && updatedRes.endDate) || dateStr < updatedRes.startDate) {
      updatedRes.startDate = dateStr;
      updatedRes.endDate = '';
    } else if (updatedRes.startDate && dateStr > updatedRes.startDate) {
      updatedRes.endDate = dateStr;
    } else if (updatedRes.startDate === dateStr) {
       updatedRes.startDate = dateStr;
       updatedRes.endDate = '';
    }

    setNewRes(updatedRes);
  }, [newRes]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (newRes.clientId && newRes.cabinCount && newRes.startDate && newRes.endDate && newRes.totalAmount !== undefined) {
      const reservationData: Reservation = {
        id: editingId || Date.now().toString(),
        clientId: newRes.clientId,
        cabinCount: newRes.cabinCount,
        startDate: newRes.startDate,
        endDate: newRes.endDate,
        adults: newRes.adults || 1,
        children: newRes.children || 0,
        totalAmount: Number(newRes.totalAmount),
        status: newRes.status || ReservationStatus.CONFIRMED,
        isArchived: newRes.isArchived || false
      };

      if (editingId && onEdit) {
        onEdit(reservationData);
      } else if (!editingId && onAdd) {
        onAdd(reservationData);
      }
      
      setShowForm(false);
      setEditingId(null);
      setNewRes({ status: ReservationStatus.INFORMATION, adults: 2, children: 0, cabinCount: 1 });
    }
  }, [newRes, editingId, onAdd, onEdit]);

  // --- Computed Values ---
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      const matchesSearch = (clients.find(c => c.id === r.clientId)?.name || '').toLowerCase().includes(filter.toLowerCase());
      
      if (viewMode === 'list') {
        const isActiveStatus = r.status === ReservationStatus.CONFIRMED || (r.status === ReservationStatus.INFORMATION && !r.isArchived);
        
        return listTab === 'active' 
            ? matchesSearch && isActiveStatus
            : matchesSearch && !isActiveStatus;
      }
      return matchesSearch;
    });
  }, [reservations, clients, filter, viewMode, listTab]);

  const selectedDateReservations = selectedDate ? getOccupancy(selectedDate).activeReservations : [];

  return {
    // Estado
    calendarState: {
      currentMonth,
      selectedDate,
      pickerMonth
    },
    formState: {
      editingId,
      showForm,
      newRes,
      filter,
      viewMode,
      listTab
    },
    
    // Datos calculados
    filteredReservations,
    selectedDateReservations,
    
    // Estados separados para fácil acceso
    currentMonth,
    selectedDate,
    pickerMonth,
    editingId,
    showForm,
    newRes,
    filter,
    viewMode,
    listTab,
    
    // Funciones de ayuda
    getDateString,
    formatDateForDisplay,
    getDaysInMonth,
    getOccupancy,
    getClientName,
    statusColor,
    
      // Acciones
    changeMonth,
    handleDateClick,
    handleEditClick,
    handleNewClick,
    handleSubmit,
    setShowForm,
    setFilter,
    setViewMode,
    setListTab,
    setNewRes,
    setSelectedDate,
  };
};