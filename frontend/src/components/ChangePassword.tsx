import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pwd: string) => {
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
    return complexityRegex.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('La contraseña debe tener al menos 12 caracteres, mayúsculas, minúsculas, números y símbolos.');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/auth/change-password', { newPassword });
      // Redirigir al dashboard tras cambiar exitosamente
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <ShieldAlert className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight text-center">Actualización Requerida</h1>
            <p className="text-slate-300 mt-2 text-sm text-center">Por razones de seguridad, debes establecer una nueva contraseña fuerte para continuar.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Nueva Contraseña"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CheckCircle2 className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Confirmar Contraseña"
                required
              />
            </div>

            <div className="text-xs text-slate-400 bg-slate-900/30 p-3 rounded-lg border border-slate-800">
              <p className="font-semibold text-slate-300 mb-1">Requisitos obligatorios:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Mínimo 12 caracteres</li>
                <li>Al menos una letra mayúscula y una minúscula</li>
                <li>Al menos un número y un símbolo especial</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Actualizando...' : 'Guardar y Continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
