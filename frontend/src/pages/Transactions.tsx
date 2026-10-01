import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, SlidersHorizontal, TrendingDown, TrendingUp, ChevronDown, X, ChevronLeft, ChevronRight, Search, Calendar, DollarSign, CreditCard } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import AddTransactionSheet, { type Transaction, type Account } from '../components/AddTransactionSheet';
import { useAuth } from '../context/AuthContext';
import { getCycleDates } from '../utils/dateUtils';

interface Category {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string;
  type: 'EXPENSE' | 'INCOME';
}

type FilterType = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';


const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  
  // Nuevos filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const startDay = user?.budget_start_day || 1;
  const cycle = getCycleDates(currentDate, startDay);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txRes, catRes, accRes] = await Promise.all([
        axios.get('/api/transactions', { withCredentials: true }),
        axios.get('/api/categories', { withCredentials: true }),
        axios.get('/api/accounts', { withCredentials: true }),
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
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
    
    let dateMatch = true;
    if (startDate && endDate) {
      dateMatch = txDate >= startDate && txDate <= endDate;
    } else {
      dateMatch = txDate >= cycle.startDate && txDate <= cycle.endDate;
    }

    const typeMatch = filterType === 'ALL' || tx.type === filterType;
    const catMatch = !filterCategoryId || tx.category_id === filterCategoryId;
    const accountMatch = !filterAccountId || tx.account_id === filterAccountId || tx.destination_account_id === filterAccountId;
    
    const searchMatch = !searchQuery || 
      (tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       tx.category_name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const txAmount = parseFloat(tx.amount);
    const minMatch = !minAmount || txAmount >= parseFloat(minAmount);
    const maxMatch = !maxAmount || txAmount <= parseFloat(maxAmount);

    return dateMatch && typeMatch && catMatch && accountMatch && searchMatch && minMatch && maxMatch;
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
  const activeAccount = filterAccountId ? accounts.find(a => a.id === filterAccountId) : null;

  // Categories available for current type filter
  const availableCatFilter = filterType === 'ALL' || filterType === 'TRANSFER'
    ? categories
    : categories.filter(c => c.type === filterType);
    
  const activeFiltersCount = (filterCategoryId ? 1 : 0) + (filterAccountId ? 1 : 0) + (minAmount || maxAmount ? 1 : 0) + (startDate && endDate ? 1 : 0);

  const clearFilters = () => {
    setFilterCategoryId('');
    setFilterAccountId('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setFilterType('ALL');
  };

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

        {/* Month selector (only show if no custom date range is set) */}
        {!(startDate && endDate) && (
          <div className="flex items-center justify-between bg-slate-800/80 rounded-2xl p-2 mb-4 border border-slate-700/50">
            <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-semibold capitalize">{cycle.label}</span>
            <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por descripción o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2 bg-slate-800/60 p-1 rounded-xl mb-3 overflow-x-auto hide-scrollbar">
          {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilterType(f); setFilterCategoryId(''); }}
              className={`flex-1 min-w-[80px] py-2 px-1 text-xs font-semibold rounded-lg transition-all ${filterType === f ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {f === 'ALL' ? 'Todos' : f === 'EXPENSE' ? 'Gastos' : f === 'INCOME' ? 'Ingresos' : 'Transf.'}
            </button>
          ))}
        </div>

        {/* Advanced filters button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${activeFiltersCount > 0 ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-slate-800/80 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros Avanzados {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-200 underline">
              Limpiar filtros
            </button>
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
                        {tx.type === 'TRANSFER' ? (
                          <span className="flex-shrink-0 flex items-center gap-0.5 text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                            <span>🏦</span>
                            <span>{tx.account_name} ➔ {tx.destination_account_name}</span>
                          </span>
                        ) : tx.account_name ? (
                          <span className="flex-shrink-0 flex items-center gap-0.5 text-xs text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded-full">
                            <span>💳</span>
                            <span>{tx.account_name}</span>
                          </span>
                        ) : null}
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

      {/* Click outside to close category dropdown (not used anymore directly but kept if needed) */}

      <AddTransactionSheet
        isOpen={isSheetOpen}
        onClose={() => { setIsSheetOpen(false); setEditingTransaction(null); }}
        categories={categories}
        accounts={accounts}
        onSuccess={fetchData}
        editingTransaction={editingTransaction}
      />

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdvancedFilters(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
                Filtros Avanzados
              </h3>
              <button onClick={() => setShowAdvancedFilters(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Categoría</label>
                <div className="relative">
                  <select
                    value={filterCategoryId}
                    onChange={(e) => setFilterCategoryId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Todas las categorías</option>
                    {availableCatFilter.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type === 'INCOME' ? 'Ingreso' : 'Gasto'})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Account Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Cuenta</label>
                <div className="relative">
                  <select
                    value={filterAccountId}
                    onChange={(e) => setFilterAccountId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Todas las cuentas</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Rango de Montos</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      placeholder="Mínimo"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl py-3 pl-9 pr-3 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl py-3 pl-9 pr-3 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Rango de Fechas Personalizado
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <span className="text-xs text-slate-500">Desde</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-xs text-slate-500">Hasta</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Al establecer un rango de fechas se ignorará el selector de ciclo mensual.</p>
              </div>

            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="flex-[2] py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                Aplicar Filtros ({activeFiltersCount})
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Transactions;
