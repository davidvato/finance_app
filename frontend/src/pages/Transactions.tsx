import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, SlidersHorizontal, TrendingDown, TrendingUp, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import AddTransactionSheet, { type Transaction } from '../components/AddTransactionSheet';
import { useAuth } from '../context/AuthContext';
import { getCycleDates } from '../utils/dateUtils';

interface Category {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string;
  type: 'EXPENSE' | 'INCOME';
}

type FilterType = 'ALL' | 'EXPENSE' | 'INCOME';

const PAYMENT_METHOD_BADGE: Record<string, { emoji: string; label: string }> = {
  CASH: { emoji: '💵', label: 'Efectivo' },
  CREDIT_CARD: { emoji: '💳', label: 'Crédito' },
  DEBIT_CARD: { emoji: '🏧', label: 'Débito' },
  TRANSFER: { emoji: '🏦', label: 'Transferencia' },
};

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const startDay = user?.budget_start_day || 1;
  const cycle = getCycleDates(currentDate, startDay);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        axios.get('/api/transactions', { withCredentials: true }),
        axios.get('/api/categories', { withCredentials: true }),
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditingTransaction(null);
    setIsSheetOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsSheetOpen(true);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Filtering
  const filtered = transactions.filter(tx => {
    const txDate = tx.transaction_date.split('T')[0];
    const cycleMatch = txDate >= cycle.startDate && txDate <= cycle.endDate;
    const typeMatch = filterType === 'ALL' || tx.type === filterType;
    const catMatch = !filterCategoryId || tx.category_id === filterCategoryId;
    return cycleMatch && typeMatch && catMatch;
  });

  // Group by date
  const grouped = filtered.reduce((acc, tx) => {
    const day = tx.transaction_date?.split('T')[0] ?? 'Sin fecha';
    if (!acc[day]) acc[day] = [];
    acc[day].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDate = (d: string) => {
    if (d === 'Sin fecha') return d;
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatAmount = (amount: string, type: string) => {
    const num = parseFloat(amount);
    const prefix = type === 'INCOME' ? '+' : '-';
    return `${prefix}$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const activeCategory = filterCategoryId ? categories.find(c => c.id === filterCategoryId) : null;

  // Categories available for current type filter
  const availableCatFilter = filterType === 'ALL'
    ? categories
    : categories.filter(c => c.type === filterType);

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Movimientos</h1>
            <p className="text-slate-400 text-xs mt-1">{filtered.length} registros</p>
          </div>
          <button
            id="btn-new-transaction"
            onClick={openNew}
            className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Month selector */}
        <div className="flex items-center justify-between bg-slate-800/80 rounded-2xl p-2 mb-4 border border-slate-700/50">
          <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold capitalize">{cycle.label}</span>
          <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2 bg-slate-800/60 p-1 rounded-xl mb-3">
          {(['ALL', 'EXPENSE', 'INCOME'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilterType(f); setFilterCategoryId(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${filterType === f ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {f === 'ALL' ? 'Todos' : f === 'EXPENSE' ? 'Gastos' : 'Ingresos'}
            </button>
          ))}
        </div>

        {/* Category filter pill */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${filterCategoryId ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-slate-800/80 border border-slate-700/40 text-slate-400'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{activeCategory ? `${activeCategory.icon_name} ${activeCategory.name}` : 'Todas las categorías'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`} />
            {filterCategoryId && (
              <span
                onClick={(e) => { e.stopPropagation(); setFilterCategoryId(''); }}
                className="ml-1 text-emerald-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>

          {showCategoryFilter && (
            <div className="absolute top-10 left-0 z-30 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 min-w-[200px] max-h-60 overflow-y-auto">
              <button
                onClick={() => { setFilterCategoryId(''); setShowCategoryFilter(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${!filterCategoryId ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-700'}`}
              >
                Todas las categorías
              </button>
              {availableCatFilter.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setFilterCategoryId(cat.id); setShowCategoryFilter(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${filterCategoryId === cat.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  <span>{cat.icon_name}</span>
                  <span>{cat.name}</span>
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${cat.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {cat.type === 'INCOME' ? '↑' : '↓'}
                  </span>
                </button>
              ))}
              {availableCatFilter.length === 0 && (
                <p className="text-slate-500 text-xs px-3 py-2">Sin categorías para este filtro</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="px-4 mt-3 space-y-5">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 bg-slate-800/60 rounded-2xl p-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-700 rounded w-1/3" />
              </div>
              <div className="h-5 bg-slate-700 rounded w-20" />
            </div>
          ))
        ) : sortedDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <SlidersHorizontal className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Sin movimientos</p>
            <p className="text-slate-600 text-sm mt-1">
              {filterCategoryId || filterType !== 'ALL' ? 'Prueba cambiando los filtros.' : 'Toca el + para registrar tu primer movimiento.'}
            </p>
          </div>
        ) : (
          sortedDays.map(day => (
            <div key={day}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 capitalize px-1">
                {formatDate(day)}
              </p>
              <div className="space-y-2">
                {grouped[day].map(tx => (
                  <button
                    key={tx.id}
                    onClick={() => openEdit(tx)}
                    className="w-full flex items-center gap-3 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 hover:bg-slate-800 hover:border-slate-600 transition-all active:scale-[0.98] text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: (tx.category_color || '#64748b') + '25' }}
                    >
                      {tx.category_icon || '💸'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{tx.description || tx.category_name || 'Sin descripción'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-slate-500 text-xs truncate">
                          {tx.category_icon && tx.category_name ? `${tx.category_icon} ${tx.category_name}` : 'Sin categoría'}
                        </p>
                        {tx.payment_method && PAYMENT_METHOD_BADGE[tx.payment_method] && (
                          <span className="flex-shrink-0 flex items-center gap-0.5 text-xs text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded-full">
                            <span>{PAYMENT_METHOD_BADGE[tx.payment_method].emoji}</span>
                            <span>{PAYMENT_METHOD_BADGE[tx.payment_method].label}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatAmount(tx.amount, tx.type)}
                      </span>
                      <span className="mt-1">
                        {tx.type === 'INCOME'
                          ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500/60" />
                          : <TrendingDown className="w-3.5 h-3.5 text-red-500/60" />
                        }
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Click outside to close category dropdown */}
      {showCategoryFilter && (
        <div className="fixed inset-0 z-20" onClick={() => setShowCategoryFilter(false)} />
      )}

      <AddTransactionSheet
        isOpen={isSheetOpen}
        onClose={() => { setIsSheetOpen(false); setEditingTransaction(null); }}
        categories={categories}
        onSuccess={fetchData}
        editingTransaction={editingTransaction}
      />

      <BottomNav />
    </div>
  );
};

export default Transactions;
