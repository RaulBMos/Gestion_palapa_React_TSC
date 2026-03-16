import React, { useState } from 'react';
import { Reservation, ReservationStatus } from '@/types';
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  User,
  Pencil,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useReservations } from '@/hooks/useReservations';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/useAuth';
import { calculateReservationTotalHours, isReservationTimeRangeValid } from '@/utils/calculations';

interface NewClientData {
  name: string;
  email: string;
  phone: string;
}

export function Reservations() {
  const {
    data: reservations,
    totalCabins: totalAvailableCabins,
    addReservation,
    updateReservation: editReservation,
    updateReservationStatus,
    deleteReservation,
  } = useReservations();
  
  const { data: clients, addClient } = useClients();
  const { isAdmin } = useAuth();

  // Estado para cliente nuevo
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState<NewClientData>({
    name: '',
    email: '',
    phone: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [listTab, setListTab] = useState<'active' | 'history'>('active');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [newRes, setNewRes] = useState<Partial<Reservation>>({
    status: ReservationStatus.INFORMATION,
    adults: undefined,
    children: undefined,
    cabinCount: undefined,
    totalAmount: undefined,
    startTime: '08:00',
    endTime: '17:00',
    totalHours: 9,
  });

  // Helpers
  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      return dateStr;
    }
    const [yearStr, monthStr, dayStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return dateStr;
    }
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const formatTimeForDisplay = (timeStr: string | undefined) => {
    if (!timeStr) return '-';
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return timeStr;
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getDaysInMonth = (date: Date) => {
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
  };

  const getOccupancy = (dateStr: string, excludeReservationId?: string) => {
    const activeReservations = reservations.filter(r =>
      r.status === ReservationStatus.CONFIRMED &&
      r.id !== excludeReservationId &&
      r.startDate <= dateStr &&
      r.endDate >= dateStr
    );

    const occupiedCount = activeReservations.reduce((acc, r) => acc + r.cabinCount, 0);
    return { occupiedCount, activeReservations };
  };

  // Actions
  const handleEditClick = (res: Reservation) => {
    if (!isAdmin) return;
    setNewRes({
      ...res,
      startTime: res.startTime || '08:00',
      endTime: res.endTime || '17:00',
      totalHours: res.totalHours ?? calculateReservationTotalHours(res.startDate, res.startTime || '08:00', res.endDate, res.endTime || '17:00'),
    });
    setEditingId(res.id);
    setIsNewClient(false);
    setNewClientData({ name: '', email: '', phone: '' });
    if (res.startDate) {
      const parts = res.startDate.split('-').map(Number);
      if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined) {
        setPickerMonth(new Date(parts[0], parts[1] - 1, 1));
      }
    }
    setShowForm(true);
  };

  const handleNewClick = () => {
    if (!isAdmin) return;
    const today = new Date();
    const todayStr = getDateString(today);
    setNewRes({
      status: ReservationStatus.INFORMATION,
      adults: undefined,
      children: undefined,
      cabinCount: undefined,
      totalAmount: undefined,
      startDate: todayStr,
      endDate: '',
      startTime: '08:00',
      endTime: '17:00',
      totalHours: 9,
    });
    setEditingId(null);
    setPickerMonth(today);
    setIsNewClient(false);
    setNewClientData({ name: '', email: '', phone: '' });
    setShowForm(true);
  };

  const handleDeleteReservation = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('¿Seguro que deseas eliminar esta reserva? Esta acción no se puede deshacer.')) {
      await deleteReservation(id);
    }
  };

  const handleDeleteFromForm = () => {
    if (!editingId || !isAdmin) return;
    if (window.confirm('¿Seguro que deseas eliminar esta reserva? Esta acción no se puede deshacer.')) {
      deleteReservation(editingId);
      setShowForm(false);
      setEditingId(null);
    }
  };

  const handleClientChange = (clientId: string) => {
    if (clientId === 'NEW') {
      setIsNewClient(true);
      setNewRes({ ...newRes, clientId: '' });
    } else {
      setIsNewClient(false);
      setNewRes({ ...newRes, clientId });
    }
  };

  const handleDateClick = (dateStr: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;

    let updatedRes = { ...newRes };

    if (!updatedRes.startDate || (updatedRes.startDate && updatedRes.endDate) || dateStr < updatedRes.startDate) {
      updatedRes.startDate = dateStr;
      updatedRes.endDate = '';
    } else if (updatedRes.startDate && dateStr >= updatedRes.startDate) {
      updatedRes.endDate = dateStr;
    }

    const totalHours = calculateReservationTotalHours(
      updatedRes.startDate,
      updatedRes.startTime || '08:00',
      updatedRes.endDate,
      updatedRes.endTime || '17:00'
    );

    setNewRes({ ...updatedRes, totalHours });
  };

  const validateForm = () => {
    if (!newRes.startDate || !newRes.endDate) {
      return 'Debe seleccionar fecha de entrada y salida.';
    }

    if (!newRes.startTime || !newRes.endTime) {
      return 'Debe seleccionar hora de entrada y hora de salida.';
    }

    const start = new Date(newRes.startDate);
    const end = new Date(newRes.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Las fechas tienen un formato inválido.';
    }

    if (end < start) {
      return 'La fecha de salida debe ser igual o mayor a la fecha de entrada.';
    }

    if (!isReservationTimeRangeValid(newRes.startDate, newRes.startTime, newRes.endDate, newRes.endTime)) {
      return 'El rango de fecha/hora no es válido. Asegúrate que la fecha y hora de salida sean mayores a las de entrada.';
    }

    const totalHours = calculateReservationTotalHours(newRes.startDate, newRes.startTime, newRes.endDate, newRes.endTime);
    if (totalHours <= 0) {
      return 'El total de horas ocupadas debe ser mayor a cero con la fecha y hora combinadas.';
    }

    if (newRes.totalHours !== undefined && Math.abs((newRes.totalHours || 0) - totalHours) > 0.01) {
      return 'El total de horas ocupadas no coincide con el rango fecha/hora.';
    }

    if (!Number.isFinite(Number(newRes.cabinCount)) || (newRes.cabinCount ?? 0) < 0) {
      return 'Debe ingresar la cantidad de cabañas (0 a 20).';
    }

    if ((newRes.cabinCount ?? 0) > 20) {
      return 'La cantidad de cabañas no puede superar 20.';
    }

    if (!Number.isFinite(Number(newRes.adults)) || (newRes.adults ?? 0) < 1) {
      return 'Debe ingresar la cantidad de adultos (mínimo 1).';
    }

    if (!Number.isFinite(Number(newRes.children)) || (newRes.children ?? 0) < 0) {
      return 'Debe ingresar la cantidad de niños (0 o más).';
    }

    const totalPeople = (newRes.adults ?? 0) + (newRes.children ?? 0);
    if (totalPeople <= 0) {
      return 'El número de personas debe ser mayor a 0.';
    }

    if (!Number.isFinite(Number(newRes.totalAmount)) || (Number(newRes.totalAmount) || 0) < 0) {
      return 'Debe ingresar un monto total válido (>= 0).';
    }

    if (isNewClient) {
      if (!newClientData.name || !newClientData.email || !newClientData.phone) {
        return 'Debe completar los datos del cliente nuevo.';
      }
    } else {
      if (!newRes.clientId) {
        return 'Debe seleccionar el cliente de la reserva.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    let clientId = newRes.clientId || 'temp_client';

    if (isNewClient) {
      try {
        const createdClient = await addClient({
          name: newClientData.name,
          email: newClientData.email,
          phone: newClientData.phone,
        });
        clientId = createdClient.id;
      } catch (err) {
        console.error('Error creating client:', err);
        setFormError('No fue posible crear el cliente. Intente nuevamente.');
        return;
      }
    }

    const cabinCount = Number(newRes.cabinCount ?? 1);
    const adults = Number(newRes.adults ?? 1);
    const children = Number(newRes.children ?? 0);
    const totalAmount = Number(newRes.totalAmount ?? 0);

    const calculatedTotalHours = calculateReservationTotalHours(newRes.startDate, newRes.startTime || '08:00', newRes.endDate, newRes.endTime || '17:00');

    if (calculatedTotalHours <= 0) {
      setFormError('El rango de fecha/hora no es válido o no genera horas positivas.');
      return;
    }

    const reservationPayload = {
      clientId,
      cabinCount: Number.isFinite(cabinCount) ? Math.max(1, Math.min(20, Math.trunc(cabinCount))) : 1,
      startDate: newRes.startDate || getDateString(new Date()),
      endDate: newRes.endDate || getDateString(new Date()),
      startTime: newRes.startTime || '08:00',
      endTime: newRes.endTime || '17:00',
      totalHours: calculatedTotalHours,
      adults: Number.isFinite(adults) ? Math.max(1, Math.trunc(adults)) : 1,
      children: Number.isFinite(children) ? Math.max(0, Math.trunc(children)) : 0,
      totalAmount: Number.isFinite(totalAmount) ? Number(totalAmount.toFixed(2)) : 0,
      status: newRes.status || ReservationStatus.INFORMATION,
      isArchived: newRes.isArchived || false,
    };

    try {
      if (editingId) {
        await editReservation({ id: editingId, ...reservationPayload });
      } else {
        await addReservation(reservationPayload);
      }
      setShowForm(false);
      setEditingId(null);
      setIsNewClient(false);
      setNewClientData({ name: '', email: '', phone: '' });
      setNewRes({
        status: ReservationStatus.INFORMATION,
        adults: undefined,
        children: undefined,
        cabinCount: undefined,
        totalAmount: undefined,
        startDate: undefined,
        endDate: undefined,
        startTime: '08:00',
        endTime: '17:00',
        totalHours: 9,
      });
    } catch (err) {
      console.error('Error saving reservation:', err);
      setFormError('Error guardando la reserva. Verifique los datos e intente nuevamente.');
    }
  };

  const changeMonth = (setter: React.Dispatch<React.SetStateAction<Date>>, current: Date, increment: number) => {
    const newDate = new Date(current);
    newDate.setMonth(newDate.getMonth() + increment);
    setter(newDate);
  };

  const filteredReservations = reservations.filter(r => {
    const clientName = clients.find(c => c.id === r.clientId)?.name || '';
    const matchesSearch = clientName.toLowerCase().includes(filter.toLowerCase());

    if (viewMode === 'list') {
      const isActiveStatus = r.status === ReservationStatus.CONFIRMED || (r.status === ReservationStatus.INFORMATION && !r.isArchived);
      return listTab === 'active' ? (matchesSearch && isActiveStatus) : (matchesSearch && !isActiveStatus);
    }
    return matchesSearch;
  });

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente desconocido';

  const statusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.CONFIRMED: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case ReservationStatus.INFORMATION: return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800';
      case ReservationStatus.COMPLETED: return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
      case ReservationStatus.CANCELLED: return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const renderCalendarGrid = (baseDate: Date, onDateSelect: (dateStr: string, e?: React.MouseEvent) => void, mode: 'main' | 'picker') => {
    const days = getDaysInMonth(baseDate);
    return (
      <div className="grid grid-cols-7 auto-rows-fr gap-1 p-2">
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="aspect-square" />;
          const dateStr = getDateString(date);
          const { occupiedCount, activeReservations } = getOccupancy(dateStr, editingId || undefined);
          const availableCount = Math.max(0, totalAvailableCabins - occupiedCount);

          const isSelected = mode === 'main' ? selectedDate === dateStr : false;
          const isStart = mode === 'picker' && newRes.startDate === dateStr;
          const isEnd = mode === 'picker' && newRes.endDate === dateStr;
          const isInRange = mode === 'picker' && newRes.startDate && newRes.endDate && dateStr > newRes.startDate && dateStr < newRes.endDate;

          let bgColor = 'bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-600 dark:hover:bg-emerald-500';
          if (availableCount === 0) {
            bgColor = 'bg-red-200 hover:bg-red-300 dark:bg-red-600 dark:hover:bg-red-500';
          } else if (availableCount < totalAvailableCabins) {
            bgColor = 'bg-orange-200 hover:bg-orange-300 dark:bg-orange-500 dark:hover:bg-orange-400';
          }

          if (isSelected || isStart || isEnd) {
            bgColor = 'bg-indigo-600 text-white dark:bg-indigo-500';
          } else if (isInRange) {
            bgColor = 'bg-indigo-200 text-indigo-900 font-bold dark:bg-indigo-700 dark:text-indigo-100';
          }

          return (
            <button
              key={dateStr}
              onClick={(e) => onDateSelect(dateStr, e)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all border ${bgColor} ${mode === 'picker' ? 'h-10' : ''}`}
            >
              <span className="text-xs font-bold">{date.getDate()}</span>
              {mode === 'main' && activeReservations.length > 0 && (
                <span className="text-[10px] opacity-75">{occupiedCount}/{totalAvailableCabins}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reservaciones</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Calendario de ocupación y gestión de estancias.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-xl flex">
            <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><CalendarIcon className="w-5 h-5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><List className="w-5 h-5" /></button>
          </div>
          {isAdmin && (
            <button onClick={handleNewClick} className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
              <Plus className="w-5 h-5" /> Nueva Reserva
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
            <button onClick={() => setListTab('active')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${listTab === 'active' ? 'bg-white dark:bg-slate-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Activas</button>
            <button onClick={() => setListTab('history')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${listTab === 'history' ? 'bg-white dark:bg-slate-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Historial</button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              placeholder="Buscar por cliente..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl outline-none text-gray-900 dark:text-white placeholder-gray-400"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredReservations.map(res => (
              <div key={res.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm relative group">
                <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${statusColor(res.status)}`}>
                  {res.status}
                </span>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{getClientName(res.clientId)}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateForDisplay(res.startDate)} - {formatDateForDisplay(res.endDate)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex gap-4 text-sm">
                    <div><p className="text-gray-400 dark:text-gray-500 text-xs">Cabañas</p><p className="font-bold dark:text-white">{res.cabinCount}</p></div>
                    <div><p className="text-gray-400 dark:text-gray-500 text-xs">Pax</p><p className="font-bold dark:text-white">{res.adults + res.children}</p></div>
                    <div><p className="text-gray-400 dark:text-gray-500 text-xs">Horario</p><p className="font-bold dark:text-white">{formatTimeForDisplay(res.startTime)} - {formatTimeForDisplay(res.endTime)}</p></div>
                    <div><p className="text-gray-400 dark:text-gray-500 text-xs">Horas</p><p className="font-bold dark:text-white">{res.totalHours?.toFixed(2) ?? '0.00'} h</p></div>
                    <div><p className="text-gray-400 dark:text-gray-500 text-xs">Total</p><p className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">${res.totalAmount}</p></div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(res)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      <select
                        className="px-2 py-1 rounded-lg text-xs font-bold border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                        value={res.status}
                        onChange={e => updateReservationStatus(res.id, e.target.value as ReservationStatus)}
                      >
                        <option value={ReservationStatus.INFORMATION}>Información</option>
                        <option value={ReservationStatus.CONFIRMED}>Confirmada</option>
                        <option value={ReservationStatus.COMPLETED}>Completada</option>
                        <option value={ReservationStatus.CANCELLED}>Cancelada</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-slate-700 text-gray-900 dark:text-white">
            <button onClick={() => changeMonth(setCurrentMonth, currentMonth, -1)} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
            <h3 className="text-xl font-bold capitalize">{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => changeMonth(setCurrentMonth, currentMonth, 1)} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-full"><ChevronRight className="w-6 h-6" /></button>
          </div>
          {renderCalendarGrid(currentMonth, (d) => setSelectedDate(d === selectedDate ? null : d), 'main')}
        </div>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-4 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{editingId ? 'Actualizar Reserva' : 'Nueva Reserva'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
                  {formError}
                </div>
              )}
              {/* Selector de cliente */}
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Cliente</label>
                <div className="mt-2 flex gap-2">
                  <select
                    className="flex-1 p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl font-medium outline-none text-gray-900 dark:text-white"
                    value={isNewClient ? 'NEW' : (newRes.clientId || '')}
                    onChange={e => handleClientChange(e.target.value)}
                    disabled={!!editingId}
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="NEW">+ Nuevo Cliente</option>
                  </select>
                </div>
              </div>

              {/* Campos de cliente nuevo */}
              {isNewClient && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <UserPlus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Datos del Cliente</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Nombre</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 rounded-xl outline-none text-gray-900 dark:text-white"
                      value={newClientData.name}
                      onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                      placeholder="Nombre completo"
                      required={isNewClient}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Correo</label>
                    <input
                      type="email"
                      className="w-full mt-1 p-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 rounded-xl outline-none text-gray-900 dark:text-white"
                      value={newClientData.email}
                      onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      required={isNewClient}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Teléfono</label>
                    <input
                      type="tel"
                      className="w-full mt-1 p-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 rounded-xl outline-none text-gray-900 dark:text-white"
                      value={newClientData.phone}
                      onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })}
                      placeholder="Número de teléfono"
                      required={isNewClient}
                    />
                  </div>
                </div>
              )}

              {/* Selector de estado */}
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Estado</label>
                <select
                  className="w-full mt-2 p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl font-medium outline-none text-gray-900 dark:text-white"
                  value={newRes.status || ReservationStatus.INFORMATION}
                  onChange={e => setNewRes({ ...newRes, status: e.target.value as ReservationStatus })}
                >
                  <option value={ReservationStatus.INFORMATION}>Información</option>
                  <option value={ReservationStatus.CONFIRMED}>Confirmada</option>
                  <option value={ReservationStatus.COMPLETED}>Completada</option>
                  <option value={ReservationStatus.CANCELLED}>Cancelada</option>
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-2xl space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Seleccionar Fechas</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => changeMonth(setPickerMonth, pickerMonth, -1)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-xs font-bold capitalize">{pickerMonth.toLocaleString('es-ES', { month: 'short', year: 'numeric' })}</span>
                    <button type="button" onClick={() => changeMonth(setPickerMonth, pickerMonth, 1)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                {renderCalendarGrid(pickerMonth, handleDateClick, 'picker')}
                <div className="flex gap-4">
                  <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-600">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Entrada</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatDateForDisplay(newRes.startDate)}</p>
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-600">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Salida</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatDateForDisplay(newRes.endDate)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Cabañas</label>
                  <input type="number" min="0" max={totalAvailableCabins} placeholder="0" className="w-full mt-2 p-2 sm:p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl font-bold text-sm sm:text-base text-gray-900 dark:text-white" value={newRes.cabinCount ?? ''} onChange={e => setNewRes({ ...newRes, cabinCount: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Adultos</label>
                  <input type="number" min="1" placeholder="0" className="w-full mt-2 p-2 sm:p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl font-bold text-sm sm:text-base text-gray-900 dark:text-white" value={newRes.adults ?? ''} onChange={e => setNewRes({ ...newRes, adults: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Niños</label>
                  <input type="number" min="0" placeholder="0" className="w-full mt-2 p-2 sm:p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl font-bold text-sm sm:text-base text-gray-900 dark:text-white" value={newRes.children ?? ''} onChange={e => setNewRes({ ...newRes, children: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Horario entrada</label>
                  <input type="time" step="1800" className="w-full mt-2 p-2 sm:p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-2xl font-bold text-sm sm:text-base text-gray-900 dark:text-white" value={newRes.startTime || '08:00'} onChange={e => {
                    const startTime = e.target.value;
                    const endTime = newRes.endTime || '17:00';
                    const totalHours = calculateReservationTotalHours(newRes.startDate, startTime, newRes.endDate, endTime);
                    setNewRes({ ...newRes, startTime, totalHours });
                  }} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Horario salida</label>
                  <input type="time" step="1800" className="w-full mt-2 p-2 sm:p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-2xl font-bold text-sm sm:text-base text-gray-900 dark:text-white" value={newRes.endTime || '17:00'} onChange={e => {
                    const endTime = e.target.value;
                    const startTime = newRes.startTime || '08:00';
                    const totalHours = calculateReservationTotalHours(newRes.startDate, startTime, newRes.endDate, endTime);
                    setNewRes({ ...newRes, endTime, totalHours });
                  }} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Total horas</label>
                  <input type="number" step="0.5" min="0" className="w-full mt-2 p-2 sm:p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl font-bold text-sm sm:text-base text-gray-900 dark:text-white" value={newRes.totalHours ?? 0} readOnly />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Total ($)</label>
                <input type="number" min="0" placeholder="0" className="w-full mt-2 p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-2xl font-bold text-indigo-700 dark:text-indigo-400 font-mono" value={newRes.totalAmount ?? ''} onChange={e => setNewRes({ ...newRes, totalAmount: e.target.value ? Number(e.target.value) : undefined })} />
              </div>

              <div className="flex gap-2 sm:gap-4">
                {editingId && (
                  <button type="button" onClick={handleDeleteFromForm} className="flex-1 py-3 sm:py-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold border border-red-200 dark:border-red-800 flex items-center justify-center gap-2 transition-all hover:bg-red-100 dark:hover:bg-red-900/50 text-sm sm:text-base">
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Eliminar</span>
                  </button>
                )}
                <button type="submit" className={`${editingId ? 'flex-1' : 'w-full'} py-3 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 text-sm sm:text-base`}>
                  {editingId ? 'Actualizar Reserva' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
