import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Pencil, Trash2, Tag } from 'lucide-react';
import BottomNav from '../components/BottomNav';

interface Category {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string;
}

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

const PRESET_ICONS = [
  '🍔', '🚗', '🏠', '💊', '🎬', '👕', '📚', '✈️', '💡', '🎮',
  '🛒', '💪', '🐾', '🎁', '💰', '🔧', '📱', '☕', '🏥', '🎓',
];

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState(PRESET_COLORS[0]);
  const [iconName, setIconName] = useState(PRESET_ICONS[0]);
  const [isSaving, setIsSaving] = useState(false);

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
    setName(''); setColorHex(PRESET_COLORS[0]); setIconName(PRESET_ICONS[0]);
    setIsFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setName(cat.name); setColorHex(cat.color_hex || PRESET_COLORS[0]); setIconName(cat.icon_name || PRESET_ICONS[0]);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editTarget) {
        await axios.put(`/api/categories/${editTarget.id}`, { name, color_hex: colorHex, icon_name: iconName }, { withCredentials: true });
      } else {
        await axios.post('/api/categories', { name, color_hex: colorHex, icon_name: iconName }, { withCredentials: true });
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
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await axios.delete(`/api/categories/${id}`, { withCredentials: true });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorías</h1>
          <p className="text-slate-400 text-xs mt-1">Organiza tus gastos</p>
        </div>
        <button
          onClick={openCreate}
          className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-4 space-y-3 mt-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 bg-slate-800/60 rounded-2xl p-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl" />
              <div className="flex-1 h-4 bg-slate-700 rounded w-1/2" />
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tag className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">Sin categorías</p>
            <p className="text-slate-600 text-sm mt-1">Toca el botón + para crear tu primera categoría.</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: cat.color_hex + '25' }}
              >
                {cat.icon_name}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{cat.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color_hex }} />
                  <span className="text-slate-500 text-xs">{cat.color_hex}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            className="relative bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-6 w-full max-w-lg mx-auto animate-slide-up"
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
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la categoría"
                required
                className="block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />

              {/* Icon picker */}
              <div>
                <label className="text-slate-400 text-sm font-medium mb-2 block">Ícono</label>
                <div className="grid grid-cols-10 gap-2">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon} type="button" onClick={() => setIconName(icon)}
                      className={`text-xl h-9 w-9 rounded-lg flex items-center justify-center transition-all ${iconName === icon ? 'bg-emerald-500/30 ring-2 ring-emerald-500' : 'bg-slate-800 hover:bg-slate-700'}`}
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
                <span className="text-white font-medium">{name || 'Previsualización'}</span>
                <div className="w-2.5 h-2.5 rounded-full ml-auto" style={{ backgroundColor: colorHex }} />
              </div>

              <button
                type="submit" disabled={isSaving}
                className="w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 transition-all"
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
