import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import AddTransactionSheet from '../components/AddTransactionSheet';
import { useAuth } from '../context/AuthContext';

interface Category {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string;
  type: 'EXPENSE' | 'INCOME';
  budget_amount?: number | null;
}

interface Budget {
  id: string;
  category_id: string;
  year_month: string;
  limit_amount: string;
}

interface Transaction {
  id: string;
  category_id: string;
  amount: string;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  transaction_date: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentYearMonth = new Date().toISOString().slice(0, 7);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, budgetRes, txRes] = await Promise.all([
        axios.get('/api/categories', { withCredentials: true }),
        axios.get(`/api/budgets?year_month=${currentYearMonth}`, { withCredentials: true }),
        axios.get('/api/transactions', { withCredentials: true }),
      ]);
      setCategories(catRes.data);
      setBudgets(budgetRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate totals
  const thisMonthTxs = transactions.filter(
    (tx) => tx.transaction_date.slice(0, 7) === currentYearMonth
  );
  const totalExpenses = thisMonthTxs
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const totalIncome = thisMonthTxs
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  // Spending per category this month
  const spendingByCategory = categories.map((cat) => {
    const spent = thisMonthTxs
      .filter((tx) => tx.category_id === cat.id && tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const budget = budgets.find((b) => b.category_id === cat.id);
    const limit = budget ? parseFloat(budget.limit_amount) : null;
    const pct = limit ? Math.min((spent / limit) * 100, 100) : null;
    return { ...cat, spent, limit, pct };
  });

  const getBarColor = (pct: number | null) => {
    if (pct === null) return 'bg-slate-600';
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 75) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const recentTxs = [...transactions].slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900/50 px-5 pt-12 pb-6">
        <p className="text-slate-400 text-sm font-medium">Bienvenido,</p>
        <h1 className="text-2xl font-bold text-white capitalize">{user?.username} 👋</h1>
        <p className="text-slate-400 text-xs mt-1">{new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-xs font-medium">Balance</span>
            </div>
            <p className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${(totalIncome - totalExpenses).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-4 col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-xs font-medium">Ingresos</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">
              ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-slate-800/60 border border-red-500/20 rounded-2xl p-4 col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-slate-400 text-xs font-medium">Gastos</span>
            </div>
            <p className="text-lg font-bold text-red-400">
              ${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Budget Progress */}
        {spendingByCategory.filter(c => c.limit !== null).length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
            <h2 className="text-white font-semibold mb-4 text-sm">Presupuestos del Mes</h2>
            <div className="space-y-4">
              {spendingByCategory
                .filter((c) => c.limit !== null)
                .map((cat) => (
                  <div key={cat.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color_hex || '#64748b' }}
                        />
                        <span className="text-slate-300 text-sm font-medium">{cat.name}</span>
                        {cat.pct !== null && cat.pct >= 100 && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </div>
                      <span className="text-slate-400 text-xs">
                        ${cat.spent.toFixed(0)} / ${cat.limit?.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getBarColor(cat.pct)}`}
                        style={{ width: `${cat.pct ?? 0}%` }}
                      />
                    </div>
                    {cat.pct !== null && (
                      <p className={`text-right text-[10px] mt-0.5 font-medium ${
                        cat.pct >= 100 ? 'text-red-400' : cat.pct >= 75 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{Math.round(cat.pct)}%</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <h2 className="text-white font-semibold mb-4 text-sm">Movimientos Recientes</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-slate-700/50 rounded w-1/2" />
                  </div>
                  <div className="h-4 w-16 bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : recentTxs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">Sin movimientos aún.</p>
              <p className="text-slate-600 text-xs mt-1">Pulsa el botón + para agregar uno.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTxs.map((tx) => {
                const cat = categories.find((c) => c.id === tx.category_id);
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: (cat?.color_hex || '#475569') + '30' }}
                    >
                      {tx.type === 'INCOME' ? '💰' : '💸'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {tx.description || cat?.name || 'Sin descripción'}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {new Date(tx.transaction_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        {cat ? ` · ${cat.name}` : ''}
                      </p>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-transform"
        aria-label="Agregar movimiento"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </button>

      {/* Bottom Sheet */}
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

export default Dashboard;
