import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheck, UserCheck, UserX, RefreshCw,
  UserPlus, Users, Trash2, X, ChevronDown
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  is_active: boolean;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER' });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/admin/users', { withCredentials: true });
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await axios.post('/api/admin/users', form, { withCredentials: true });
      setIsFormOpen(false);
      setForm({ username: '', email: '', password: '', role: 'USER' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await axios.put(`/api/admin/users/${user.id}`, { is_active: !user.is_active }, { withCredentials: true });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const forcePasswordReset = async (userId: string) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, { force_password_reset: true }, { withCredentials: true });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`¿Eliminar permanentemente al usuario "${username}"? Esta acción también eliminará sus registros financieros.`)) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`, { withCredentials: true });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-amber-900/20 to-slate-900 px-5 pt-12 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400 text-xs mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} en el sistema</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-all"
        >
          <UserPlus className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-4 mt-2 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-700 rounded w-1/2" />
                <div className="h-2 bg-slate-700/60 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400">No hay usuarios registrados</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className={`bg-slate-800/60 border rounded-2xl p-4 ${user.is_active ? 'border-slate-700/40' : 'border-red-800/30 opacity-60'}`}>
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                  user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold">{user.username}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{user.email}</p>
                  <p className="text-slate-600 text-[10px] mt-1">
                    Creado: {new Date(user.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/40 flex-wrap">
                <button
                  onClick={() => toggleActive(user)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    user.is_active
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  {user.is_active ? 'Desactivar' : 'Activar'}
                </button>

                <button
                  onClick={() => forcePasswordReset(user.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Clave
                </button>

                <button
                  onClick={() => deleteUser(user.id, user.username)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create User Sheet */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setIsFormOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-6 w-full max-w-lg mx-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nuevo Usuario</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm">{error}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text" placeholder="Nombre de usuario" required
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              <input
                type="email" placeholder="Correo electrónico" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              <input
                type="password" placeholder="Contraseña temporal" required
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              <div className="relative">
                <select
                  value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  <option value="USER">Usuario Estándar (USER)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-slate-500 text-xs">El usuario deberá cambiar su contraseña en el primer inicio de sesión.</p>
              <button
                type="submit" disabled={isSaving}
                className="w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 transition-all"
              >
                {isSaving ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AdminPanel;
