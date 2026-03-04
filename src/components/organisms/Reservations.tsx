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
      r.endDate > dateStr
    );

    const occupiedCount = activeReservations.reduce((acc, r) => acc + r.cabinCount, 0);
    return { occupiedCount, activeReservations };
  };

  // Actions
  const handleEditClick = (res: Reservation) => {
    if (!isAdmin) return;
    setNewRes({ ...res });
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
      adults: 2,
      children: 0,
      cabinCount: 1,
      totalAmount: 0,
      startDate: todayStr,
      endDate: ''
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

  const handleDateClick = (dateStr: string) => {
    if (!isAdmin) return;
    let updatedRes = { ...newRes };
    if (!updatedRes.startDate || (updatedRes.startDate && updatedRes.endDate) || dateStr < updatedRes.startDate) {
      updatedRes.startDate = dateStr;
      updatedRes.endDate = '';
    } else if (updatedRes.startDate && dateStr > updatedRes.startDate) {
      updatedRes.endDate = dateStr;
    }
    setNewRes(updatedRes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    let clientId = newRes.clientId;

    // Si es cliente nuevo, primero crear el cliente
    if (isNewClient && newClientData.name && newClientData.email && newClientData.phone) {
      try {
        const createdClient = await addClient({
          name: newClientData.name,
          email: newClientData.email,
          phone: newClientData.phone
        });
        clientId = createdClient.id;
      } catch (err) {
        console.error('Error creating client:', err);
        return;
      }
    }

    if (clientId && newRes.cabinCount && newRes.startDate && newRes.endDate && newRes.totalAmount !== undefined) {
      const reservationData: Reservation = {
        id: editingId || Date.now().toString(),
        clientId: clientId,
        cabinCount: newRes.cabinCount,
        startDate: newRes.startDate,
        endDate: newRes.endDate,
        adults: newRes.adults || 1,
        children: newRes.children || 0,
        totalAmount: Number(newRes.totalAmount),
        status: newRes.status || ReservationStatus.INFORMATION,
        isArchived: newRes.isArchived || false
      };

      if (editingId) {
        await editReservation(reservationData);
      } else {
        await addReservation(reservationData);
      }

      setShowForm(false);
      setEditingId(null);
      setIsNewClient(false);
      setNewClientData({ name: '', email: '', phone: '' });
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
      case ReservationStatus.CONFIRMED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case ReservationStatus.INFORMATION: return 'bg-sky-100 text-sky-700 border-sky-200';
      case ReservationStatus.COMPLETED: return 'bg-slate-100 text-slate-700 border-slate-200';
      case ReservationStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100';
    }
  };

  const renderCalendarGrid = (baseDate: Date, onDateSelect: (dateStr: string) => void, mode: 'main' | 'picker') => {
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

          let bgColor = 'bg-emerald-50 hover:bg-emerald-100';
          if (availableCount === 0) {
            bgColor = 'bg-red-50 hover:bg-red-100';
          } else if (availableCount < totalAvailableCabins) {
            bgColor = 'bg-orange-50 hover:bg-orange-100';
          }

          if (isSelected || isStart || isEnd) {
            bgColor = 'bg-indigo-600 text-white';
          } else if (isInRange) {
            bgColor = 'bg-indigo-100 text-indigo-900 font-bold';
          }

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
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
          <h2 className="text-2xl font-bold text-gray-900">Reservaciones</h2>
          <p className="text-gray-500 text-sm">Calendario de ocupación y gestión de estancias.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg ${viewMode === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><CalendarIcon className="w-5 h-5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><List className="w-5 h-5" /></button>
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
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setListTab('active')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${listTab === 'active' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Activas</button>
            <button onClick={() => setListTab('history')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${listTab === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Historial</button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              placeholder="Buscar por cliente..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredReservations.map(res => (
              <div key={res.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative group">
                <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${statusColor(res.status)}`}>
                  {res.status}
                </span>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-indigo-600" /></div>
                  <div>
                    <h3 className="font-bold text-gray-900">{getClientName(res.clientId)}</h3>
                    <p className="text-xs text-gray-400">{formatDateForDisplay(res.startDate)} - {formatDateForDisplay(res.endDate)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex gap-4 text-sm">
                    <div><p className="text-gray-400 text-xs">Cabañas</p><p className="font-bold">{res.cabinCount}</p></div>
                    <div><p className="text-gray-400 text-xs">Pax</p><p className="font-bold">{res.adults + res.children}</p></div>
                    <div><p className="text-gray-400 text-xs">Total</p><p className="font-bold text-indigo-600 font-mono">${res.totalAmount}</p></div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(res)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      <select
                        className="px-2 py-1 rounded-lg text-xs font-bold border border-gray-200"
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-50 text-gray-900">
            <button onClick={() => changeMonth(setCurrentMonth, currentMonth, -1)} className="p-2 hover:bg-gray-50 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
            <h3 className="text-xl font-bold capitalize">{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => changeMonth(setCurrentMonth, currentMonth, 1)} className="p-2 hover:bg-gray-50 rounded-full"><ChevronRight className="w-6 h-6" /></button>
          </div>
          {renderCalendarGrid(currentMonth, (d) => setSelectedDate(d === selectedDate ? null : d), 'main')}
        </div>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{editingId ? 'Actualizar Reserva' : 'Nueva Reserva'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selector de cliente */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Cliente</label>
                <div className="mt-2 flex gap-2">
                  <select
                    className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium outline-none"
                    value={isNewClient ? 'NEW' : (newRes.clientId || '')}
                    onChange={e => handleClientChange(e.target.value)}
                    disabled={!!editingId}
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="NEW">+ Nuevo Cliente</option>
                  </select>
                </div>
              </div>

              {/* Campos de cliente nuevo */}
              {isNewClient && (
                <div className="bg-indigo-50 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <UserPlus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Datos del Cliente</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-3 bg-white border border-indigo-100 rounded-xl outline-none"
                      value={newClientData.name}
                      onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                      placeholder="Nombre completo"
                      required={isNewClient}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Correo</label>
                    <input
                      type="email"
                      className="w-full mt-1 p-3 bg-white border border-indigo-100 rounded-xl outline-none"
                      value={newClientData.email}
                      onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      required={isNewClient}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Teléfono</label>
                    <input
                      type="tel"
                      className="w-full mt-1 p-3 bg-white border border-indigo-100 rounded-xl outline-none"
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
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                <select
                  className="w-full mt-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium outline-none"
                  value={newRes.status || ReservationStatus.INFORMATION}
                  onChange={e => setNewRes({ ...newRes, status: e.target.value as ReservationStatus })}
                >
                  <option value={ReservationStatus.INFORMATION}>Información</option>
                  <option value={ReservationStatus.CONFIRMED}>Confirmada</option>
                  <option value={ReservationStatus.COMPLETED}>Completada</option>
                  <option value={ReservationStatus.CANCELLED}>Cancelada</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Seleccionar Fechas</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => changeMonth(setPickerMonth, pickerMonth, -1)} className="p-1 hover:bg-gray-200 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-xs font-bold capitalize">{pickerMonth.toLocaleString('es-ES', { month: 'short', year: 'numeric' })}</span>
                    <button type="button" onClick={() => changeMonth(setPickerMonth, pickerMonth, 1)} className="p-1 hover:bg-gray-200 rounded-full"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                {renderCalendarGrid(pickerMonth, handleDateClick, 'picker')}
                <div className="flex gap-4">
                  <div className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Entrada</p>
                    <p className="text-sm font-bold text-indigo-600">{formatDateForDisplay(newRes.startDate)}</p>
                  </div>
                  <div className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Salida</p>
                    <p className="text-sm font-bold text-indigo-600">{formatDateForDisplay(newRes.endDate)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Cabañas</label>
                  <input type="number" min="1" max={totalAvailableCabins} className="w-full mt-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={newRes.cabinCount} onChange={e => setNewRes({ ...newRes, cabinCount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Adultos</label>
                  <input type="number" min="1" className="w-full mt-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={newRes.adults} onChange={e => setNewRes({ ...newRes, adults: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Niños</label>
                  <input type="number" min="0" className="w-full mt-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={newRes.children} onChange={e => setNewRes({ ...newRes, children: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Total ($)</label>
                <input type="number" min="0" className="w-full mt-2 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-bold text-indigo-700 font-mono" value={newRes.totalAmount} onChange={e => setNewRes({ ...newRes, totalAmount: Number(e.target.value) })} />
              </div>

              <div className="flex gap-4">
                {editingId && (
                  <button type="button" onClick={handleDeleteFromForm} className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-200 flex items-center justify-center gap-2 transition-all hover:bg-red-100">
                    <Trash2 className="w-5 h-5" /> Eliminar
                  </button>
                )}
                <button type="submit" className={`${editingId ? 'flex-1' : 'w-full'} py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700`}>
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
