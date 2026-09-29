import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { getCycleDates } from '../utils/dateUtils';

interface BudgetSummary {
  category_id: string;
  category_name: string;
  icon_name: string;
  color_hex: string;
  limit_amount: string | null;
  spent_amount: string;
}

const Budgets: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [summaries, setSummaries] = useState<BudgetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const startDay = user?.budget_start_day || 1;
  const cycle = getCycleDates(currentDate, startDay);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/budgets/summary?cycle_id=${cycle.cycleId}&start_date=${cycle.startDate}&end_date=${cycle.endDate}`, { withCredentials: true });
      setSummaries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [cycle.cycleId, cycle.startDate, cycle.endDate]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Separate into those with budget and without
  const withBudget = summaries.filter(s => s.limit_amount !== null);
  const withoutBudget = summaries.filter(s => s.limit_amount === null && parseFloat(s.spent_amount) > 0);

  const totalBudgeted = withBudget.reduce((sum, s) => sum + parseFloat(s.limit_amount!), 0);
  const totalSpentInBudgets = withBudget.reduce((sum, s) => sum + parseFloat(s.spent_amount), 0);

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white mb-4">Presupuestos</h1>
        
        {/* Month selector */}
        <div className="flex items-center justify-between bg-slate-800 rounded-2xl p-2 mb-4">
          <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold capitalize">{cycle.label}</span>
          <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Global summary card */}
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target className="w-24 h-24 text-emerald-500" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">Total Presupuestado</p>
          <p className="text-3xl font-bold text-white mb-4">${totalBudgeted.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-slate-300">Gastado: ${totalSpentInBudgets.toLocaleString('es-MX')}</span>
            <span className={totalSpentInBudgets > totalBudgeted ? 'text-red-400' : 'text-emerald-400'}>
              {totalBudgeted > 0 ? Math.round((totalSpentInBudgets / totalBudgeted) * 100) : 0}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${totalSpentInBudgets > totalBudgeted ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min((totalSpentInBudgets / (totalBudgeted || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* With Budget */}
        {withBudget.length > 0 && (
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
        )}

        {/* Without Budget but have expenses */}
        {withoutBudget.length > 0 && (
          <div>
            <h3 className="text-slate-400 text-sm font-semibold mb-3 px-1 uppercase tracking-wider">Gastos sin límite definido</h3>
            <div className="space-y-3">
              {withoutBudget.map(cat => (
                <div key={cat.category_id} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/30 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color_hex + '25' }}>
                      {cat.icon_name}
                    </div>
                    <span className="text-slate-300 text-sm font-medium">{cat.category_name}</span>
                  </div>
                  <span className="text-white font-semibold text-sm">${parseFloat(cat.spent_amount).toLocaleString('es-MX')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && summaries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
            <Tag className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-300 font-medium">Sin datos en {cycle.label}</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Budgets;
