import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingDown, TrendingUp, Wallet, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import BottomNav from '../components/BottomNav';
import AddTransactionSheet, { type Account } from '../components/AddTransactionSheet';
import { useAuth } from '../context/AuthContext';
import { getCycleDates } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string;
  type: 'EXPENSE' | 'INCOME';
  budget_amount?: number | null;
}

interface BudgetSummary {
  category_id: string;
  category_name: string;
  icon_name: string;
  color_hex: string;
  limit_amount: string | null;
  spent_amount: string;
}

interface Transaction {
  id: string;
  category_id: string;
  account_id?: string;
  destination_account_id?: string;
  amount: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  description: string;
  transaction_date: string;
  category_name?: string;
  category_color?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summaries, setSummaries] = useState<BudgetSummary[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const startDay = user?.budget_start_day || 1;
  const cycle = getCycleDates(currentDate, startDay);

  const fetchData = async () => {
    try {
      const [catRes, txRes, sumRes, accRes] = await Promise.all([
        axios.get('/api/categories', { withCredentials: true }),
        axios.get('/api/transactions', { withCredentials: true }),
        axios.get(`/api/budgets/summary?cycle_id=${cycle.cycleId}&start_date=${cycle.startDate}&end_date=${cycle.endDate}`, { withCredentials: true }),
        axios.get('/api/accounts', { withCredentials: true }),
      ]);
      setCategories(catRes.data);
      setTransactions(txRes.data);
      setSummaries(sumRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cycle.cycleId, cycle.startDate, cycle.endDate]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Map transactions to include their effective type based on category if it's a transfer
  const monthlyTx = transactions.filter(tx => {
    const txDate = tx.transaction_date.split('T')[0];
    return txDate >= cycle.startDate && txDate <= cycle.endDate;
  }).map(tx => {
    if (tx.type === 'TRANSFER' && tx.category_id) {
      const cat = categories.find(c => c.id === tx.category_id);
      return { ...tx, effectiveType: cat ? cat.type : tx.type };
    }
    return { ...tx, effectiveType: tx.type };
  });

  const expenses = monthlyTx.filter(t => t.effectiveType === 'EXPENSE').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const income = monthlyTx.filter(t => t.effectiveType === 'INCOME').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const balance = income - expenses;

  const withBudget = summaries.filter(s => s.limit_amount !== null);

  // Data for Donut Chart
  const expensesByCategory = monthlyTx
    .filter(t => t.effectiveType === 'EXPENSE')
    .reduce((acc, tx) => {
      const key = tx.category_name || 'Sin categoría';
      if (!acc[key]) {
        acc[key] = { name: key, value: 0, color: tx.category_color || '#64748b' };
      }
      acc[key].value += parseFloat(tx.amount);
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>);

  const CHART_COLORS = [
    '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  const chartData = Object.values(expensesByCategory)
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));

  const accountsAtCycleEnd = accounts.map(acc => {
    let accBalance = 0;
    const isCreditCard = acc.type === 'CREDIT_CARD';

    const cycleTx = transactions.filter(tx => {
      const txDate = tx.transaction_date.split('T')[0];
      return txDate >= cycle.startDate && txDate <= cycle.endDate;
    });

    cycleTx.forEach(tx => {
      const amount = parseFloat(tx.amount);

      if (isCreditCard) {
        // For credit cards: only count new charges (EXPENSE) made this cycle.
        // Ignore payments/transfers in (those correspond to paying off the PREVIOUS cycle's debt).
        if (tx.type === 'EXPENSE' && tx.account_id === acc.id) {
          accBalance -= amount; // debt grows
        }
        // Intentionally skip INCOME and TRANSFER destinations for credit cards
      } else {
        // For BANK / CASH accounts: standard net flow for the cycle
        if (tx.type === 'INCOME' && tx.account_id === acc.id) {
          accBalance += amount;
        } else if (tx.type === 'EXPENSE' && tx.account_id === acc.id) {
          accBalance -= amount;
        } else if (tx.type === 'TRANSFER') {
          if (tx.account_id === acc.id) accBalance -= amount;
          if (tx.destination_account_id === acc.id) accBalance += amount;
        }
      }
    });

    return { ...acc, historicalBalance: accBalance };
  });

  const totalBalances = accountsAtCycleEnd.reduce((acc, a) => acc + Math.abs(a.historicalBalance), 0);

  const accountsChartData = accountsAtCycleEnd
    .filter(acc => acc.historicalBalance !== 0)
    .sort((a, b) => Math.abs(b.historicalBalance) - Math.abs(a.historicalBalance))
    .map((acc, index) => ({
      name: acc.name,
      value: Math.abs(acc.historicalBalance),
      realValue: acc.historicalBalance,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      {/* Header & Month Selector */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-6 rounded-b-3xl shadow-lg border-b border-slate-700/50">
        <div className="flex justify-between items-center mb-6">
          <div className="cursor-pointer" onClick={() => navigate('/profile')}>
            <p className="text-slate-400 text-sm hover:text-slate-300">Hola, {user?.username} ⚙️</p>
            <h1 className="text-2xl font-bold text-white">Mi Resumen</h1>
          </div>
          <button onClick={() => setIsSheetOpen(true)} className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Month selector */}
        <div className="flex items-center justify-between bg-slate-800/80 rounded-2xl p-2 mb-6 border border-slate-700/50">
          <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold capitalize">{cycle.label}</span>
          <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50">
          <p className="text-slate-400 text-sm font-medium mb-1">Balance del mes</p>
          <h2 className={`text-4xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
            ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>

          <div className="flex gap-4 mt-6">
            <div className="flex-1 bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-emerald-500/20 p-1 rounded-md">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-slate-400 text-xs font-medium">Ingresos</span>
              </div>
              <p className="text-emerald-400 font-bold text-sm truncate">${income.toLocaleString('es-MX')}</p>
            </div>
            <div className="flex-1 bg-red-500/10 rounded-xl p-3 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-red-500/20 p-1 rounded-md">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-slate-400 text-xs font-medium">Gastos</span>
              </div>
              <p className="text-red-400 font-bold text-sm truncate">${expenses.toLocaleString('es-MX')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Chart Section */}
        <div>
          <h3 className="text-white font-semibold mb-4 text-lg">Distribución de Gastos</h3>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-3xl p-5">
            {chartData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-36 w-full md:w-1/3">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `$${Number(value).toLocaleString('es-MX')}`}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-2/3 space-y-2">
                  {chartData.slice(0, showAllExpenses ? chartData.length : 4).map((d) => (
                    <div key={d.name} className="flex items-center text-sm w-full">
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-300">{d.name}</span>
                      </div>
                      <div className="flex-grow border-b border-dotted border-slate-600 mx-3 relative top-[-4px]"></div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-white font-semibold">${d.value.toLocaleString('es-MX')}</span>
                        <span className="text-slate-500 text-xs w-8 text-right">{Math.round((d.value / expenses) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                  {chartData.length > 4 && !showAllExpenses && (
                    <p onClick={() => setShowAllExpenses(true)} className="text-center md:text-left text-xs text-slate-500 mt-3 font-medium cursor-pointer hover:text-slate-300">Ver {chartData.length - 4} más...</p>
                  )}
                  {chartData.length > 4 && showAllExpenses && (
                    <p onClick={() => setShowAllExpenses(false)} className="text-center md:text-left text-xs text-slate-500 mt-3 font-medium cursor-pointer hover:text-slate-300">Ver menos</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center opacity-70">
                <Wallet className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-300 font-medium">No hay gastos este mes</p>
              </div>
            )}
          </div>
        </div>

        {/* Accounts Section */}
        {accounts.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Saldos por Cuenta</h3>
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-3xl p-5">
              {accountsChartData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-36 w-full md:w-1/3">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={accountsChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {accountsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(_value: any, _name: any, props: any) => `$${Number(props.payload.realValue).toLocaleString('es-MX')}`}
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-2/3 space-y-2">
                    {accountsChartData.slice(0, showAllAccounts ? accountsChartData.length : 4).map((d) => (
                      <div key={d.name} className="flex items-center text-sm w-full">
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-slate-300">{d.name}</span>
                        </div>
                        <div className="flex-grow border-b border-dotted border-slate-600 mx-3 relative top-[-4px]"></div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`font-semibold ${d.realValue < 0 ? 'text-red-400' : 'text-white'}`}>
                            ${d.realValue.toLocaleString('es-MX')}
                          </span>
                          <span className="text-slate-500 text-xs w-8 text-right">
                            {totalBalances > 0 ? Math.round((d.value / totalBalances) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {accountsChartData.length > 4 && !showAllAccounts && (
                      <p onClick={() => setShowAllAccounts(true)} className="text-center md:text-left text-xs text-slate-500 mt-3 font-medium cursor-pointer hover:text-slate-300">Ver {accountsChartData.length - 4} más...</p>
                    )}
                    {accountsChartData.length > 4 && showAllAccounts && (
                      <p onClick={() => setShowAllAccounts(false)} className="text-center md:text-left text-xs text-slate-500 mt-3 font-medium cursor-pointer hover:text-slate-300">Ver menos</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center opacity-70">
                  <Wallet className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-300 font-medium">No hay saldos en esta fecha</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budgets Section */}
        {withBudget.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Estado de Presupuestos</h3>
            <div className="space-y-4">
              {withBudget.map(cat => {
                const spent = parseFloat(cat.spent_amount);
                const limit = parseFloat(cat.limit_amount!);
                const percentage = Math.min((spent / limit) * 100, 100);
                const isOver = spent > limit;
                const remaining = limit - spent;

                return (
                  <div key={cat.category_id} className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: cat.color_hex + '25' }}>
                          {cat.icon_name}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{cat.category_name}</p>
                          <p className={`text-xs font-medium mt-0.5 ${isOver ? 'text-red-400' : 'text-slate-400'}`}>
                            {isOver ? `Excedido $${Math.abs(remaining).toLocaleString('es-MX')}` : `Quedan $${remaining.toLocaleString('es-MX')}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">${spent.toLocaleString('es-MX')}</p>
                        <p className="text-slate-500 text-xs">de ${limit.toLocaleString('es-MX')}</p>
                      </div>
                    </div>

                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? 'bg-red-500' : percentage > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AddTransactionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        categories={categories}
        accounts={accounts}
        onSuccess={fetchData}
      />
      <BottomNav />
    </div>
  );
};

export default Dashboard;
