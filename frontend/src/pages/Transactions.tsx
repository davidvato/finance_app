import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeftRight, TrendingDown, TrendingUp, Plus } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import AddTransactionSheet from '../components/AddTransactionSheet';

interface Category { id: string; name: string; color_hex: string; icon_name: string; }
interface Transaction {
  id: string; category_id: string; amount: string;
  type: 'EXPENSE' | 'INCOME'; description: string; transaction_date: string;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        axios.get('/api/transactions', { withCredentials: true }),
        axios.get('/api/categories', { withCredentials: true }),
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = transactions.filter(tx => filterType === 'ALL' || tx.type === filterType);

  // Group by date
  const grouped = filtered.reduce((acc: Record<string, Transaction[]>, tx) => {
    const dateKey = tx.transaction_date.slice(0, 10);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Movimientos</h1>
        <p className="text-slate-400 text-xs mt-1">Historial completo de transacciones</p>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-slate-800/60 mx-4 rounded-xl p-1 mt-4 gap-1">
        {(['ALL', 'EXPENSE', 'INCOME'] as const).map((f) => (
          <button
            key={f} onClick={() => setFilterType(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterType === f
                ? f === 'EXPENSE' ? 'bg-red-500/90 text-white' : f === 'INCOME' ? 'bg-emerald-500/90 text-white' : 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f === 'ALL' ? 'Todos' : f === 'EXPENSE' ? 'Gastos' : 'Ingresos'}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-11 h-11 bg-slate-800 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-800 rounded w-2/3" />
                <div className="h-2 bg-slate-800/60 rounded w-1/3" />
              </div>
              <div className="h-4 bg-slate-800 rounded w-16" />
            </div>
          ))
        ) : sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ArrowLeftRight className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">Sin movimientos</p>
            <p className="text-slate-600 text-sm mt-1">Agrega tu primer movimiento con el botón +.</p>
          </div>
        ) : (
          sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
                {new Date(dateKey + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="space-y-3">
                {grouped[dateKey].map((tx) => {
                  const cat = categories.find(c => c.id === tx.category_id);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/30 rounded-2xl px-4 py-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: (cat?.color_hex || '#475569') + '25' }}
                      >
                        {cat?.icon_name || (tx.type === 'INCOME' ? '💰' : '💸')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {tx.description || cat?.name || 'Sin descripción'}
                        </p>
                        {cat && <p className="text-slate-500 text-xs mt-0.5">{cat.name}</p>}
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <p className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <div className={`flex items-center gap-1 mt-0.5`}>
                          {tx.type === 'INCOME'
                            ? <TrendingUp className="w-3 h-3 text-emerald-500/70" />
                            : <TrendingDown className="w-3 h-3 text-red-500/70" />}
                          <span className="text-slate-600 text-[10px]">{tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-transform"
        aria-label="Agregar movimiento"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </button>

      <AddTransactionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        categories={categories}
        onSuccess={fetchData}
      />
      <BottomNav />
    </div>
  );
};

export default Transactions;
