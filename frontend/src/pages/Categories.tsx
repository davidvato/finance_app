import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Pencil, Trash2, Tag, TrendingDown, TrendingUp } from 'lucide-react';
import BottomNav from '../components/BottomNav';

interface Category {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string;
  type: 'EXPENSE' | 'INCOME';
  budget_amount: number | null;
}

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

const PRESET_ICONS = [
  '🍔', '🚗', '🏠', '💊', '🎬', '👕', '📚', '✈️', '💡', '🎮',
  '🛒', '💪', '🐾', '🎁', '💰', '🔧', '📱', '☕', '🏥', '🎓',
  '🍕', '🎵', '🏋️', '🌮', '🍺', '👶', '🐶', '🌿', '⚽', '🎨',
];

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState(PRESET_COLORS[0]);
  const [iconName, setIconName] = useState(PRESET_ICONS[0]);
  const [catType, setCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/categories', { withCredentials: true });
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setName('');
    setColorHex(PRESET_COLORS[0]);
    setIconName(PRESET_ICONS[0]);
    setCatType('EXPENSE');
    setBudgetAmount('');
    setIsFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setName(cat.name);
    setColorHex(cat.color_hex || PRESET_COLORS[0]);
    setIconName(cat.icon_name || PRESET_ICONS[0]);
    setCatType(cat.type || 'EXPENSE');
    setBudgetAmount(cat.budget_amount != null ? String(cat.budget_amount) : '');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name,
        color_hex: colorHex,
        icon_name: iconName,
        type: catType,
        budget_amount: budgetAmount ? parseFloat(budgetAmount) : null,
      };
      if (editTarget) {
        await axios.put(`/api/categories/${editTarget.id}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/categories', payload, { withCredentials: true });
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta categoría? Los movimientos asociados se conservarán.')) return;
    try {
      await axios.delete(`/api/categories/${id}`, { withCredentials: true });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = categories.filter(c => filterType === 'ALL' || c.type === filterType);

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorías</h1>
          <p className="text-slate-400 text-xs mt-1">{categories.length} categorías registradas</p>
        </div>
        <button
          id="btn-new-category"
          onClick={openCreate}
          className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mt-2 mb-3">
        <div className="flex gap-2 bg-slate-800/60 p-1 rounded-xl">
          {([['ALL', 'Todas'], ['EXPENSE', 'Gastos'], ['INCOME', 'Ingresos']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterType(val)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${filterType === val ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 bg-slate-800/60 rounded-2xl p-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tag className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">Sin categorías</p>
            <p className="text-slate-600 text-sm mt-1">Toca el botón + para crear tu primera categoría.</p>
          </div>
        ) : (
          filtered.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: cat.color_hex + '25' }}
              >
                {cat.icon_name}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{cat.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {cat.type === 'INCOME' ? '↑ Ingreso' : '↓ Gasto'}
                  </span>
                  {cat.budget_amount != null && (
                    <span className="text-xs text-slate-400">Ppto: ${Number(cat.budget_amount).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(cat)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Sheet Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setIsFormOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-6 w-full max-w-lg mx-auto animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editTarget ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Name */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la categoría"
                required
                className="block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />

              {/* Type selector */}
              <div>
                <label className="text-slate-400 text-sm font-medium mb-2 block">Tipo de categoría</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatType('EXPENSE')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${catType === 'EXPENSE' ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <TrendingDown className="w-4 h-4" /> Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatType('INCOME')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${catType === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <TrendingUp className="w-4 h-4" /> Ingreso
                  </button>
                </div>
              </div>

              {/* Budget amount (only for EXPENSE) */}
              {catType === 'EXPENSE' && (
                <div>
                  <label className="text-slate-400 text-sm font-medium mb-2 block">Presupuesto mensual (opcional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="0.00"
                      className="block w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <p className="text-slate-600 text-xs mt-1">Deja vacío si no quieres definir un límite.</p>
                </div>
              )}

              {/* Icon picker */}
              <div>
                <label className="text-slate-400 text-sm font-medium mb-2 block">Ícono</label>
                <div className="grid grid-cols-10 gap-1.5">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon} type="button" onClick={() => setIconName(icon)}
                      className={`text-xl h-9 w-full rounded-lg flex items-center justify-center transition-all ${iconName === icon ? 'bg-emerald-500/30 ring-2 ring-emerald-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-slate-400 text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color} type="button" onClick={() => setColorHex(color)}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full transition-transform ${colorHex === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: colorHex + '25' }}>
                  {iconName}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-medium">{name || 'Previsualización'}</span>
                  <p className={`text-xs mt-0.5 ${catType === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {catType === 'INCOME' ? '↑ Ingreso' : '↓ Gasto'}
                    {budgetAmount && catType === 'EXPENSE' ? ` · Ppto $${parseFloat(budgetAmount).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colorHex }} />
              </div>

              <button
                type="submit" disabled={isSaving}
                className="w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSaving ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Categories;
