import React, { useState } from 'react';
import axios from 'axios';
import { User, Calendar, Save, ArrowLeft, Wallet, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [startDay, setStartDay] = useState(user?.budget_start_day || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.put('/api/auth/profile', { budget_start_day: startDay }, { withCredentials: true });
      setUser(res.data.user);
      setMessage('Perfil actualizado con éxito');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-3xl p-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white">{user?.username}</h2>
          <p className="text-slate-400 text-sm">{user?.role}</p>
        </div>

        {/* Link to Accounts */}
        <div 
          onClick={() => navigate('/accounts')}
          className="bg-slate-800/60 border border-slate-700/40 rounded-3xl p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold">Mis Cuentas</h3>
              <p className="text-slate-400 text-xs mt-0.5">Bancos, efectivo y tarjetas</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </div>

        <div className="bg-slate-800/60 border border-slate-700/40 rounded-3xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Configuración Financiera
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Día de inicio de mes (Corte)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Si tu tarjeta corta el día 10, selecciona 10. Tus presupuestos irán del 10 al 9 del siguiente mes.
              </p>
              <select
                value={startDay}
                onChange={(e) => setStartDay(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>Día {day}</option>
                ))}
              </select>
            </div>

            {message && <p className="text-emerald-400 text-sm">{message}</p>}
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving || startDay === user?.budget_start_day}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
