import React, { useState } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '@/types';
import { TrendingUp, TrendingDown, Plus, CreditCard, Banknote, Pencil, Trash2, X, Calendar, Tag } from 'lucide-react';
import { useData } from '@/hooks/useData';

interface FinancesProps {
  transactions?: Transaction[];
  addTransaction?: (t: Transaction) => void;
  editTransaction?: (t: Transaction) => void;
  deleteTransaction?: (id: string) => void;
}

export const Finances: React.FC<FinancesProps> = (props) => {
  // ✅ Obtener datos del contexto (o usar props si se proporcionan para retrocompatibilidad)
  const contextData = useData();

  const transactions = props.transactions ?? contextData.transactions;
  const addTransaction = props.addTransaction ?? contextData.addTransaction;
  const editTransaction = props.editTransaction ?? contextData.updateTransaction;
  const deleteTransaction = props.deleteTransaction ?? contextData.deleteTransaction;
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.INCOME);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: TransactionType.INCOME,
    paymentMethod: PaymentMethod.CASH,
    date: new Date().toISOString().split('T')[0] || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        editTransaction(transactionData);
      } else {
        addTransaction(transactionData);
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
    setFormData(transaction);
    setEditingId(transaction.id);
    setActiveTab(transaction.type);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      deleteTransaction(id);
    }
  };

  const filteredTransactions = transactions
    .filter(t => t.type === activeTab)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-900">Gestión Financiera</h2>

      <div className="bg-slate-100 p-1 rounded-xl flex">
        <button
          onClick={() => setActiveTab(TransactionType.INCOME)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <TrendingUp className="w-4 h-4" /> Ingresos
        </button>
        <button
          onClick={() => setActiveTab(TransactionType.EXPENSE)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <TrendingDown className="w-4 h-4" /> Gastos
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className={`${activeTab === TransactionType.INCOME ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            } text-white px-5 py-2.5 rounded-xl flex items-center shadow-md font-medium transition-all`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Registrar {activeTab}
        </button>
      </div>

      <div className="space-y-3">
        {filteredTransactions.map(t => (
          <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between relative group">
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(t)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                title="Editar transacción"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                title="Eliminar transacción"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {t.paymentMethod === PaymentMethod.CASH ? <Banknote className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">{t.description}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(t.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <Tag className="w-3 h-3" />
                  <span className="capitalize">{t.category}</span>
                  {t.reservationId && (
                    <>
                      <span>•</span>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">Reserva {t.reservationId}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className={`text-lg font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
              {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
            </div>
          </div>
        ))}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === TransactionType.INCOME ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
            </div>
            <p className="font-medium">No hay registros de {activeTab.toLowerCase()} aún.</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? `Editar ${activeTab}` : `Registrar ${activeTab}`}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    type: activeTab,
                    paymentMethod: PaymentMethod.CASH,
                    date: new Date().toISOString().split('T')[0] || ''
                  });
                }}
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  value={formData.amount || ''}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Método</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                  >
                    <option value={PaymentMethod.CASH}>Efectivo</option>
                    <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  value={formData.date || ''}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      type: activeTab,
                      paymentMethod: PaymentMethod.CASH,
                      date: new Date().toISOString().split('T')[0] || ''
                    });
                  }}
                  className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 text-white font-semibold rounded-xl shadow-lg ${activeTab === TransactionType.INCOME ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                    }`}
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};