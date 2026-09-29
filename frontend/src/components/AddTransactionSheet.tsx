import React, { useState, useEffect } from 'react';
import { X, Tag, FileText, CalendarDays, Trash2 } from 'lucide-react';
import axios from 'axios';

interface Category {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface Transaction {
  id: string;
  category_id: string | null;
  amount: string;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  transaction_date: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
}

const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
  editingTransaction = null,
}) => {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount);
      setCategoryId(editingTransaction.category_id || '');
      setDescription(editingTransaction.description || '');
      setDate(editingTransaction.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
    } else {
      setType('EXPENSE');
      setAmount('');
      setCategoryId('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [editingTransaction, isOpen]);

  // Filter categories by selected type
  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        category_id: categoryId || null,
        amount: parseFloat(amount).toFixed(2),
        type,
        description,
        transaction_date: date,
      };

      if (editingTransaction) {
        await axios.put(`/api/transactions/${editingTransaction.id}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/transactions', { id: crypto.randomUUID(), ...payload }, { withCredentials: true });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el movimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTransaction) return;
    if (!window.confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/transactions/${editingTransaction.id}`, { withCredentials: true });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!editingTransaction;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-6 w-full max-w-lg mx-auto animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                title="Eliminar movimiento"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm">{error}</div>
        )}

        {/* Type Toggle */}
        <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
          <button
            type="button" onClick={() => { setType('EXPENSE'); setCategoryId(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${type === 'EXPENSE' ? 'bg-red-500/90 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Gasto
          </button>
          <button
            type="button" onClick={() => { setType('INCOME'); setCategoryId(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${type === 'INCOME' ? 'bg-emerald-500/90 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Ingreso
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <div className="text-center">
              <span className="text-4xl font-bold text-white">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-4xl font-bold text-white bg-transparent border-none outline-none text-center w-48 placeholder-slate-600"
                required
                autoFocus={!isEditing}
              />
            </div>
            <div className="h-0.5 bg-slate-700 rounded-full mt-2 mx-8" />
          </div>

          {/* Category - filtered by type */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Tag className="h-5 w-5 text-slate-400" />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
            >
              <option value="">Sin categoría</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon_name} {cat.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="Descripción (opcional)"
            />
          </div>

          {/* Date */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-4 rounded-xl text-white font-bold text-base transition-all active:scale-[0.98] ${
              type === 'EXPENSE'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : `Guardar ${type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionSheet;
