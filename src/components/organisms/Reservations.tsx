import React, { useState } from 'react';
import { Reservation, ReservationStatus, Client } from '@/types';
import { Plus, Search, Calendar as CalendarIcon, Home, X, Check, ChevronLeft, ChevronRight, List, User, Pencil, ArrowRight, AlertCircle, History, Archive, Info } from 'lucide-react';
import { useData } from '@/hooks/useData';

interface ReservationsProps {
  reservations?: Reservation[];
  clients?: Client[];
  totalAvailableCabins?: number;
  addReservation?: (res: Reservation) => void;
  editReservation?: (res: Reservation) => void;
  updateReservationStatus?: (id: string, status: ReservationStatus) => void;
  archiveReservation?: (id: string) => void;
}

export const Reservations: React.FC<ReservationsProps> = (props) => {
  // ✅ Obtener datos del contexto (o usar props si se proporcionan para retrocompatibilidad)
  const contextData = useData();

  const reservations = props.reservations ?? contextData.reservations;
  const clients = props.clients ?? contextData.clients;
  const totalAvailableCabins = props.totalAvailableCabins ?? contextData.totalCabins;
  const addReservation = props.addReservation ?? contextData.addReservation;
  const editReservation = props.editReservation ?? contextData.updateReservation;
  const updateReservationStatus = props.updateReservationStatus ?? contextData.updateReservationStatus;
  const archiveReservation = props.archiveReservation ?? contextData.archiveReservation;
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [listTab, setListTab] = useState<'active' | 'history'>('active'); // New state for tabs
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

  // Calendar State (Main View)
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Picker State (Inside Modal)
  const [pickerMonth, setPickerMonth] = useState(new Date());

  const [newRes, setNewRes] = useState<Partial<Reservation>>({
    status: ReservationStatus.INFORMATION,
    adults: 2,
    children: 0,
    cabinCount: 1
  });

  // Helpers
  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Safe date formatter to prevent timezone off-by-one errors
  const formatDateForDisplay = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    // Split explicitly to avoid browser parsing as UTC midnight
    const [y, m, d] = dateStr.split('-').map(Number);
    // Create date as Local Time (Year, MonthIndex, Day)
    if (y === undefined || m === undefined || d === undefined) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

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
      r.id !== excludeReservationId && // Exclude current if editing to check real availability
      r.startDate <= dateStr &&
      r.endDate > dateStr // Checkout day is free
    );

    const occupiedCount = activeReservations.reduce((acc, r) => acc + r.cabinCount, 0);
    return { occupiedCount, activeReservations };
  };

  // Actions
  const handleEditClick = (res: Reservation) => {
    setNewRes({ ...res });
    setEditingId(res.id);
    // Set picker month to the start date of reservation
    if (res.startDate) {
      const [y, m, d] = res.startDate.split('-').map(Number);
      // Ensure valid date creation
      if (y !== undefined && m !== undefined && d !== undefined && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setPickerMonth(new Date(y, m - 1, 1));
      } else {
        setPickerMonth(new Date());
      }
    } else {
      setPickerMonth(new Date());
    }
    setShowForm(true);
  };

  const handleNewClick = () => {
    const today = new Date();
    const todayStr = getDateString(today);

    setNewRes({
      status: ReservationStatus.INFORMATION,
      adults: 2,
      children: 0,
      cabinCount: 1,
      totalAmount: 0,
      startDate: todayStr, // Default to today
      endDate: ''
    });
    setEditingId(null);
    setPickerMonth(today);
    setShowForm(true);
  };

  const handleDateClick = (dateStr: string) => {
    // Determine input logic
    let updatedRes = { ...newRes };

    // Case 1: Start fresh if we have both dates or no start date, or if user clicks before current start
    if (!updatedRes.startDate || (updatedRes.startDate && updatedRes.endDate) || dateStr < updatedRes.startDate) {
      updatedRes.startDate = dateStr;
      updatedRes.endDate = ''; // Reset end date
    }
    // Case 2: User clicks after start date -> Set end date
    else if (updatedRes.startDate && dateStr > updatedRes.startDate) {
      updatedRes.endDate = dateStr;
    }
    // Case 3: Same date clicked -> Just set start (single day stay not usually allowed but acts as reset)
    else if (updatedRes.startDate === dateStr) {
      updatedRes.startDate = dateStr;
      updatedRes.endDate = '';
    }

    setNewRes(updatedRes);
  };

  const handleSubmit = (e: React.FormEvent) => {
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

      if (editingId) {
        editReservation(reservationData);
      } else {
        addReservation(reservationData);
      }

      setShowForm(false);
      setEditingId(null);
      setNewRes({ status: ReservationStatus.INFORMATION, adults: 2, children: 0, cabinCount: 1 });
    }
  };

  // Navigation Logic
  const changeMonth = (setter: React.Dispatch<React.SetStateAction<Date>>, current: Date, increment: number) => {
    const newDate = new Date(current);
    newDate.setMonth(newDate.getMonth() + increment);
    setter(newDate);
  };

  // Render Logic - FILTERING
  const filteredReservations = reservations.filter(r => {
    const matchesSearch = (clients.find(c => c.id === r.clientId)?.name || '').toLowerCase().includes(filter.toLowerCase());

    if (viewMode === 'list') {
      // Active = Confirmed OR (Information AND Not Archived)
      const isActiveStatus = r.status === ReservationStatus.CONFIRMED || (r.status === ReservationStatus.INFORMATION && !r.isArchived);

      // If tab is 'active', show active status. If 'history', show !active (Completed, Cancelled, Archived Info).
      return listTab === 'active'
        ? matchesSearch && isActiveStatus
        : matchesSearch && !isActiveStatus;
    }
    return matchesSearch;
  });

  const selectedDateReservations = selectedDate ? getOccupancy(selectedDate).activeReservations : [];

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente desconocido';

  const statusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.CONFIRMED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case ReservationStatus.INFORMATION: return 'bg-sky-100 text-sky-700 border-sky-200';
      case ReservationStatus.COMPLETED: return 'bg-slate-100 text-slate-700 border-slate-200';
      case ReservationStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100';
    }
  };

  // --- Sub-component: Calendar Grid (Reused for Main View and Picker) ---
  const renderCalendarGrid = (
    baseDate: Date,
    onDateSelect: (dateStr: string) => void,
    mode: 'main' | 'picker'
  ) => {
    const days = getDaysInMonth(baseDate);

    return (
      <div className="grid grid-cols-7 auto-rows-fr gap-1 p-2">
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="aspect-square" />;

          const dateStr = getDateString(date);
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
            // Picker Logic
            if (newRes.startDate === dateStr) isStart = true;
            if (newRes.endDate === dateStr) isEnd = true;
            if (newRes.startDate && newRes.endDate && dateStr > newRes.startDate && dateStr < newRes.endDate) {
              isInRange = true;
            }
          }

          // --- Base Availability Colors (The "Box" Color) ---
          // Default: Green (Available)
          let bgColor = 'bg-emerald-50 hover:bg-emerald-100';
          let textColor = 'text-emerald-900';
          let borderColor = 'border-emerald-100';

          // Full (Red)
          if (availableCount === 0) {
            bgColor = 'bg-red-50 hover:bg-red-100';
            textColor = 'text-red-900';
            borderColor = 'border-red-100';

            // In picker, dim unavailable dates if not part of active selection
            if (mode === 'picker' && !isInRange && !isStart && !isEnd) {
              textColor = 'text-red-300';
              bgColor = 'bg-red-50/50';
            }
          }
          // Partial (Orange/Amber)
          else if (availableCount < totalAvailableCabins) {
            bgColor = 'bg-orange-50 hover:bg-orange-100';
            textColor = 'text-orange-900';
            borderColor = 'border-orange-100';
          }

          // --- Selection Overrides (Indigo/Blue) ---
          // Applies on top of availability colors when the user selects the date
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
            // Mix indigo with base, but usually just indigo for range clarity
            bgColor = 'bg-indigo-100';
            textColor = 'text-indigo-900';
            borderColor = 'border-indigo-200';
          }

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-start pt-1 gap-0.5 transition-all border overflow-hidden ${bgColor} ${borderColor} ${mode === 'picker' ? 'h-10 sm:h-12 w-full justify-center pt-0' : ''}`}
            >
              <span className={`text-sm font-bold ${textColor}`}>
                {date.getDate()}
              </span>

              {/* Content: Names (Main Mode) or Counts (Picker/Default) */}
              <div className="w-full px-0.5 flex flex-col items-center">
                {mode === 'main' ? (
                  activeReservations.length > 0 ? (
                    // Show Client Names (First Name only to save space)
                    activeReservations.slice(0, 2).map((res) => (
                      <span key={res.id} className={`text-[9px] font-medium leading-tight truncate w-full text-center ${textColor}`}>
                        {getClientName(res.clientId).split(' ')[0]}
                      </span>
                    ))
                  ) : (
                    // Show Available Count when empty (optional, keeping it for clarity)
                    <span className={`text-[10px] font-medium opacity-60 ${textColor}`}>
                      {availableCount}
                    </span>
                  )
                ) : (
                  // Picker Mode: Always show availability numbers for logic clarity
                  (!isInRange && !isStart && !isEnd) && (
                    <span className={`text-[10px] font-medium opacity-80 ${textColor}`}>
                      {availableCount === 0 ? 'Full' : `${availableCount}`}
                    </span>
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-safe-offset">
      {/* Header Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reservas</h2>
          <p className="text-sm text-slate-500">Administra disponibilidad y ocupación</p>
        </div>

        <div className="flex w-full xl:w-auto gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex shrink-0">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista Calendario"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista Lista"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleNewClick}
            className="flex-1 xl:flex-none bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center shadow-md shadow-sky-200 font-semibold transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Reserva
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Active / History Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-2">
            <button
              onClick={() => setListTab('active')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${listTab === 'active' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <AlertCircle className="w-4 h-4" /> Activas
            </button>
            <button
              onClick={() => setListTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${listTab === 'history' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <History className="w-4 h-4" /> Historial
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder={listTab === 'active' ? "Buscar reservas activas..." : "Buscar en el historial..."}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium shadow-sm"
            />
          </div>

          {/* List View */}
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <Archive className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No se encontraron reservas {listTab === 'active' ? 'activas' : 'en el historial'}.</p>
              </div>
            ) : (
              filteredReservations.map(res => (
                <div key={res.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-xs font-bold border-b border-l ${statusColor(res.status)}`}>
                    {res.status} {res.isArchived && '(Archivado)'}
                  </div>

                  <button
                    onClick={() => handleEditClick(res)}
                    className="absolute top-3 right-3 sm:right-auto sm:left-[calc(100%-4rem)] p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                    title="Editar Reserva"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-4 mt-2 sm:mt-0">
                    <div className="bg-sky-50 p-3 rounded-2xl shrink-0">
                      {res.status === ReservationStatus.INFORMATION ? (
                        <Info className="w-6 h-6 text-sky-600" />
                      ) : (
                        <CalendarIcon className="w-6 h-6 text-sky-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate pr-16">{getClientName(res.clientId)}</h3>
                      <div className="flex flex-wrap gap-y-1 gap-x-3 text-sm text-slate-500 mt-1">
                        <span className="flex items-center text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold">
                          <Home className="w-3.5 h-3.5 mr-1.5" />
                          {res.cabinCount} {res.cabinCount === 1 ? 'Cabaña' : 'Cabañas'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center">
                          {formatDateForDisplay(res.startDate)}
                          <span className="mx-1">→</span>
                          {formatDateForDisplay(res.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <span className="block text-xs text-slate-400 font-medium">Adultos</span>
                        <span className="block text-sm font-bold text-slate-700">{res.adults}</span>
                      </div>
                      {res.children > 0 && (
                        <div className="text-center border-l border-slate-200 pl-4">
                          <span className="block text-xs text-slate-400 font-medium">Niños &lt;5</span>
                          <span className="block text-sm font-bold text-slate-700">{res.children}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-slate-400 font-medium">Total</span>
                      <span className="block text-lg font-bold text-emerald-600">${res.totalAmount}</span>
                    </div>
                  </div>

                  {/* Status Actions - Only show action buttons in Active view */}
                  {listTab === 'active' && (
                    <div className="flex gap-3 pt-2 border-t border-slate-50">
                      {res.status === ReservationStatus.INFORMATION && (
                        <>
                          <button
                            onClick={() => updateReservationStatus(res.id, ReservationStatus.CONFIRMED)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <Check className="w-4 h-4" /> Confirmar
                          </button>
                          <button
                            onClick={() => archiveReservation(res.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"
                          >
                            <Archive className="w-4 h-4" /> No Concretado
                          </button>
                        </>
                      )}
                      {res.status === ReservationStatus.CONFIRMED && (
                        <>
                          <button
                            onClick={() => updateReservationStatus(res.id, ReservationStatus.COMPLETED)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <Check className="w-4 h-4" /> Completar
                          </button>
                          <button
                            onClick={() => updateReservationStatus(res.id, ReservationStatus.CANCELLED)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                          >
                            <X className="w-4 h-4" /> Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* In history view, show info for archived/cancelled */}
                  {listTab === 'history' && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <span className="text-xs text-slate-400 italic flex items-center gap-2">
                        <Archive className="w-3 h-3" />
                        Estado: {res.status} {res.isArchived ? '(No concretada)' : ''}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Calendar View */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <button onClick={() => changeMonth(setCurrentMonth, currentMonth, -1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-500">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-lg text-slate-800 capitalize">
                {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => changeMonth(setCurrentMonth, currentMonth, 1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-500">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-slate-400 bg-slate-50/50">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {renderCalendarGrid(
              currentMonth,
              (dateStr) => setSelectedDate(dateStr === selectedDate ? null : dateStr),
              'main'
            )}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                Reservas para el {formatDateForDisplay(selectedDate)}
                <span className="ml-2 text-xs font-normal text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md">
                  {getOccupancy(selectedDate).occupiedCount} de {totalAvailableCabins} cabañas ocupadas
                </span>
              </h3>
              {selectedDateReservations.length > 0 ? (
                <div className="grid gap-3">
                  {selectedDateReservations.map(res => (
                    <div key={res.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-sky-100 p-2 rounded-full">
                          <User className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{getClientName(res.clientId)}</p>
                          <p className="text-xs text-slate-500 flex gap-2">
                            <span>{res.cabinCount} {res.cabinCount === 1 ? 'cabaña' : 'cabañas'}</span>
                            <span>•</span>
                            <span>{res.adults} adultos, {res.children} niños</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(res.status)}`}>
                          {res.status}
                        </span>
                        <button
                          onClick={() => handleEditClick(res)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-400 border border-dashed border-slate-200">
                  No hay reservas activas en esta fecha.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)} />
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Reserva' : 'Nueva Reserva'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-6">
              {/* Cliente & Status Row */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cliente</label>
                  <select
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all appearance-none"
                    value={newRes.clientId || ''}
                    onChange={e => setNewRes({ ...newRes, clientId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
                  <select
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all appearance-none text-sm font-medium"
                    value={newRes.status}
                    onChange={e => setNewRes({ ...newRes, status: e.target.value as ReservationStatus })}
                  >
                    {Object.values(ReservationStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Picker Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-slate-700">Seleccionar Fechas</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => changeMonth(setPickerMonth, pickerMonth, -1)} className="p-1 hover:bg-slate-200 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm font-medium">{pickerMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                    <button type="button" onClick={() => changeMonth(setPickerMonth, pickerMonth, 1)} className="p-1 hover:bg-slate-200 rounded-full"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex gap-4 mb-4 text-sm">
                  <div className={`flex-1 p-2 rounded-lg border ${newRes.startDate ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                    <span className="block text-xs text-slate-400">Entrada</span>
                    <span className="font-semibold text-slate-900">{formatDateForDisplay(newRes.startDate) || '-'}</span>
                  </div>
                  <div className="flex items-center text-slate-300"><ArrowRight className="w-4 h-4" /></div>
                  <div className={`flex-1 p-2 rounded-lg border ${newRes.endDate ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                    <span className="block text-xs text-slate-400">Salida</span>
                    <span className="font-semibold text-slate-900">{formatDateForDisplay(newRes.endDate) || '-'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-200 mb-2">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                    <div key={d} className="text-center text-xs text-slate-400 py-1">{d}</div>
                  ))}
                </div>
                {renderCalendarGrid(pickerMonth, handleDateClick, 'picker')}
              </div>

              {/* Cabaña Quantity */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cantidad de Cabañas</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max={totalAvailableCabins}
                    step="1"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    value={newRes.cabinCount}
                    onChange={e => setNewRes({ ...newRes, cabinCount: Number(e.target.value) })}
                  />
                  <span className="text-xl font-bold text-sky-600 min-w-[3ch] text-center">
                    {newRes.cabinCount}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Total disponible: {totalAvailableCabins}</p>
              </div>

              {/* Personas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Adultos & Niños &gt; 5</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-transparent font-bold text-slate-900 text-lg outline-none"
                    value={newRes.adults}
                    onChange={e => setNewRes({ ...newRes, adults: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Niños &lt; 5 años</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-transparent font-bold text-slate-900 text-lg outline-none"
                    value={newRes.children}
                    onChange={e => setNewRes({ ...newRes, children: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Total */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Total a cobrar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-4 bg-emerald-50 border border-emerald-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700 text-lg placeholder-emerald-300"
                    value={newRes.totalAmount || ''}
                    placeholder="0.00"
                    onChange={e => setNewRes({ ...newRes, totalAmount: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-sky-200 active:scale-[0.98] transition-all"
              >
                {editingId ? 'Guardar Cambios' : 'Confirmar Reserva'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};