import React, { useState } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  CreditCard,
  Banknote,
  Pencil,
  Trash2,
  X,
  Calendar,
  Tag
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/contexts/useAuth';

export function Finances() {
  const {
    transactions,
    addTransaction,
    updateTransaction: editTransaction,
    deleteTransaction
  } = useData();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.INCOME);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: TransactionType.INCOME,
    paymentMethod: PaymentMethod.CASH,
    date: new Date().toISOString().split('T')[0] || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (formData.amount && formData.category && formData.description) {
      const transactionData: Transaction = {
        id: editingId || Date.now().toString(),
        type: activeTab,
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date || new Date().toISOString(),
        paymentMethod: formData.paymentMethod || PaymentMethod.CASH,
        ...(formData.reservationId && { reservationId: formData.reservationId })
      };

      if (editingId) {
        await editTransaction(transactionData);
      } else {
        await addTransaction(transactionData);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        type: activeTab,
        paymentMethod: PaymentMethod.CASH,
        date: new Date().toISOString().split('T')[0] || ''
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    if (!isAdmin) return;
    setFormData(transaction);
    setEditingId(transaction.id);
    setActiveTab(transaction.type);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      await deleteTransaction(id);
    }
  };

  const filteredTransactions = transactions
    .filter(t => t.type === activeTab)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión Financiera</h2>
          <p className="text-gray-500 text-sm">Control de ingresos y egresos operativos.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                type: activeTab,
                paymentMethod: PaymentMethod.CASH,
                date: new Date().toISOString().split('T')[0] || ''
              });
              setShowForm(true);
            }}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${activeTab === TransactionType.INCOME
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                : 'bg-red-600 hover:bg-red-700 shadow-red-100'
              }`}
          >
            <Plus className="w-5 h-5" /> Registrar {activeTab === TransactionType.INCOME ? 'Ingreso' : 'Gasto'}
          </button>
        )}
      </div>

      <div className="bg-gray-100 p-1 rounded-2xl flex">
        <button
          onClick={() => setActiveTab(TransactionType.INCOME)}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow' : 'text-gray-500'
            }`}
        >
          <TrendingUp className="w-4 h-4" /> Ingresos
        </button>
        <button
          onClick={() => setActiveTab(TransactionType.EXPENSE)}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow' : 'text-gray-500'
            }`}
        >
          <TrendingDown className="w-4 h-4" /> Gastos
        </button>
      </div>

      <div className="grid gap-4">
        {filteredTransactions.map(t => (
          <div key={t.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:border-gray-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                {t.paymentMethod === PaymentMethod.CASH ? <Banknote className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{t.description}</h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(t.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {t.category}</span>
                  {t.reservationId && <span className="bg-gray-50 px-2 py-0.5 rounded text-indigo-500 border border-gray-100">REF:{t.reservationId.substring(0, 8)}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className={`text-xl font-black font-mono ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
              </div>
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(t)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${activeTab === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-300' : 'bg-red-50 text-red-300'}`}>
              {activeTab === TransactionType.INCOME ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
            </div>
            <p className="text-gray-400 font-bold">No se registran {activeTab.toLowerCase()} este periodo.</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Editar Registro' : `Nuevo ${activeTab === TransactionType.INCOME ? 'Ingreso' : 'Egreso'}`}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xl text-indigo-600 font-mono outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Fecha</label>
                  <input
                    type="date"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Pago de electricidad de Enero"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Categoría</label>
                  <select
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {activeTab === TransactionType.INCOME ? (
                      <>
                        <option value="Renta">Renta</option>
                        <option value="Servicios Extra">Servicios Extra</option>
                      </>
                    ) : (
                      <>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Servicios">Servicios (Luz/Agua)</option>
                        <option value="Impuestos">Impuestos</option>
                        <option value="Limpieza">Limpieza</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Método</label>
                  <select
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                  >
                    <option value={PaymentMethod.CASH}>Efectivo</option>
                    <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-5 text-white font-black text-lg rounded-2xl shadow-xl transition-all ${activeTab === TransactionType.INCOME
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-50'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-50'
                  }`}
              >
                {editingId ? 'Guardar Cambios' : 'Registrar Transacción'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
