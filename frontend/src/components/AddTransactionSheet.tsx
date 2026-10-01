import React, { useState, useEffect } from 'react';
import { X, Tag, FileText, CalendarDays, Trash2, Wallet, ArrowRight } from 'lucide-react';
import axios from 'axios';

export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT_CARD';
  balance: string;
}

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
  account_id?: string;
  destination_account_id?: string;
  amount: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  description: string;
  transaction_date: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  account_name?: string;
  destination_account_name?: string;
}

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
}

const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  onSuccess,
  editingTransaction = null,
}) => {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
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
      setAccountId(editingTransaction.account_id || '');
      setDestinationAccountId(editingTransaction.destination_account_id || '');
      setDescription(editingTransaction.description || '');
      setDate(editingTransaction.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
    } else {
      setType('EXPENSE');
      setAmount('');
      setCategoryId('');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setDestinationAccountId('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [editingTransaction, isOpen, accounts]);

  // Filter categories by selected type (Transfers can use any category optionally)
  const filteredCategories = type === 'TRANSFER' ? categories : categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }

    if (!accountId) {
      setError('Debes seleccionar una cuenta de origen.');
      return;
    }

    if (type === 'TRANSFER' && !destinationAccountId) {
      setError('Debes seleccionar una cuenta de destino.');
      return;
    }
    
    if (type === 'TRANSFER' && accountId === destinationAccountId) {
      setError('La cuenta origen y destino no pueden ser la misma.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        category_id: categoryId || null,
        account_id: accountId,
        destination_account_id: type === 'TRANSFER' ? destinationAccountId : null,
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
          <button
            type="button" onClick={() => { setType('TRANSFER'); setCategoryId(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${type === 'TRANSFER' ? 'bg-blue-500/90 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Transferencia
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

          {/* Accounts */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Wallet className="h-5 w-5 text-slate-400" />
              </div>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                required
              >
                <option value="" disabled>Selecciona cuenta {type === 'TRANSFER' ? 'origen' : ''}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name} (${Number(acc.balance).toFixed(2)})</option>
                ))}
              </select>
            </div>

            {type === 'TRANSFER' && (
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  required
                >
                  <option value="" disabled>Selecciona cuenta destino</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${Number(acc.balance).toFixed(2)})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Category - optional for transfer */}
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
                : type === 'TRANSFER'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500'
            } disabled:opacity-50 mt-4`}
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : `Guardar ${type === 'EXPENSE' ? 'Gasto' : type === 'TRANSFER' ? 'Transferencia' : 'Ingreso'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionSheet;
