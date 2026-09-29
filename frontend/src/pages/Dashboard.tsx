import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingDown, TrendingUp, Wallet, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

interface Transaction {
  id: string;
  category_id: string;
  amount: string;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  transaction_date: string;
  category_name?: string;
  category_color?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const fetchData = async () => {
    try {
      const [catRes, txRes] = await Promise.all([
        axios.get('/api/categories', { withCredentials: true }),
        axios.get('/api/transactions', { withCredentials: true }),
      ]);
      setCategories(catRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [yearMonth]); // Currently fetching all tx, but we can filter by month locally

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const monthName = currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  // Filter transactions for current month
  const monthlyTx = transactions.filter(tx => {
    const txDate = tx.transaction_date.split('T')[0];
    return txDate.startsWith(yearMonth);
  });

  const expenses = monthlyTx.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const income = monthlyTx.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const balance = income - expenses;

  // Data for Donut Chart
  const expensesByCategory = monthlyTx
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, tx) => {
      const key = tx.category_name || 'Sin categoría';
      if (!acc[key]) {
        acc[key] = { name: key, value: 0, color: tx.category_color || '#64748b' };
      }
      acc[key].value += parseFloat(tx.amount);
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>);

  const chartData = Object.values(expensesByCategory).sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      {/* Header & Month Selector */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-6 rounded-b-3xl shadow-lg border-b border-slate-700/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-slate-400 text-sm">Hola, {user?.username}</p>
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
          <span className="text-white font-semibold capitalize">{monthName}</span>
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
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
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
                <div className="mt-4 space-y-2">
                  {chartData.slice(0, 4).map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-300">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">${d.value.toLocaleString('es-MX')}</span>
                        <span className="text-slate-500 text-xs w-8 text-right">{Math.round((d.value / expenses) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                  {chartData.length > 4 && (
                    <p className="text-center text-xs text-slate-500 mt-3 font-medium cursor-pointer">Ver {chartData.length - 4} más...</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center opacity-70">
                <Wallet className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-300 font-medium">No hay gastos este mes</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
