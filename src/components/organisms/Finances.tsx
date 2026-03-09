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
  Tag,
  Settings,
  Check
} from 'lucide-react';
import { useFinancials } from '@/hooks/useFinancials';
import { useAuth } from '@/contexts/useAuth';

const DEFAULT_EXPENSE_CATEGORIES = ['Mantenimiento', 'Servicios (Luz/Agua)', 'Impuestos', 'Limpieza'];
const DEFAULT_INCOME_CATEGORIES = ['Renta', 'Servicios Extra'];

interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

const STORAGE_KEY = 'cg_categories';

function loadCategories(): Category[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const categories: Category[] = [
    ...DEFAULT_INCOME_CATEGORIES.map((name, i) => ({ id: `income_${i}`, name, type: TransactionType.INCOME })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({ id: `expense_${i}`, name, type: TransactionType.EXPENSE }))
  ];
  return categories;
}

function saveCategories(categories: Category[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function Finances() {
  const {
    data: transactions,
    addTransaction,
    updateTransaction: editTransaction,
    deleteTransaction
  } = useFinancials();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.INCOME);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

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

  const getCategoriesForType = (type: TransactionType) => 
    categories.filter(c => c.type === type);

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !isAdmin) return;
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      type: activeTab
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(updated);
    setNewCategoryName('');
  };

  const handleUpdateCategory = () => {
    if (!newCategoryName.trim() || !editingCategoryId || !isAdmin) return;
    const updated = categories.map(c => 
      c.id === editingCategoryId ? { ...c, name: newCategoryName.trim() } : c
    );
    setCategories(updated);
    saveCategories(updated);
    setNewCategoryName('');
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('¿Eliminar esta categoría? Las transacciones existentes mantendrán la categoría.')) {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      saveCategories(updated);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setNewCategoryName(cat.name);
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
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowCategoriesModal(true)}
              className="px-4 py-3 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5" /> Categorías
            </button>
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
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${activeTab === TransactionType.INCOME
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                : 'bg-red-600 hover:bg-red-700 shadow-red-100'
              }`}
            >
            <Plus className="w-5 h-5" /> Registrar {activeTab === TransactionType.INCOME ? 'Ingreso' : 'Gasto'}
            </button>
          </div>
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
                    {getCategoriesForType(activeTab).map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
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

      {/* Modal de Gestión de Categorías */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Gestionar Categorías</h3>
              <button onClick={() => { setShowCategoriesModal(false); setEditingCategoryId(null); setNewCategoryName(''); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva categoría..."
                  className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (editingCategoryId ? handleUpdateCategory() : handleAddCategory())}
                />
                <button
                  onClick={editingCategoryId ? handleUpdateCategory : handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {editingCategoryId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {editingCategoryId && (
                <button
                  onClick={() => { setEditingCategoryId(null); setNewCategoryName(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ingresos</h4>
              {getCategoriesForType(TransactionType.INCOME).map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="font-medium text-emerald-800">{cat.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => startEditCategory(cat)} className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Gastos</h4>
              {getCategoriesForType(TransactionType.EXPENSE).map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <span className="font-medium text-red-800">{cat.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => startEditCategory(cat)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setShowCategoriesModal(false); setEditingCategoryId(null); setNewCategoryName(''); }}
              className="w-full mt-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
