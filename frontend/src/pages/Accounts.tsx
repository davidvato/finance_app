import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Wallet, Plus, X, Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT_CARD';
  balance: string;
  exclude_from_balance: boolean;
}

const TYPE_CONFIG = {
  CASH: { icon: '💵', label: 'Efectivo', color: 'text-emerald-400' },
  BANK: { icon: '🏦', label: 'Cuenta Bancaria', color: 'text-blue-400' },
  CREDIT_CARD: { icon: '💳', label: 'Tarjeta de Crédito', color: 'text-rose-400' },
};

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'CASH' | 'BANK' | 'CREDIT_CARD'>('BANK');
  const [balance, setBalance] = useState('');
  const [excludeFromBalance, setExcludeFromBalance] = useState(false);
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/accounts', { withCredentials: true });
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setName(account.name);
      setType(account.type);
      setBalance(account.balance);
      setExcludeFromBalance(account.exclude_from_balance);
    } else {
      setEditingAccount(null);
      setName('');
      setType('BANK');
      setBalance('');
      setExcludeFromBalance(false);
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('El nombre es requerido');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingAccount) {
        await axios.put(`/api/accounts/${editingAccount.id}`, {
          name,
          type,
          balance: balance ? parseFloat(balance).toFixed(2) : 0,
          exclude_from_balance: excludeFromBalance,
        }, { withCredentials: true });
      } else {
        await axios.post('/api/accounts', {
          name,
          type,
          balance: balance ? parseFloat(balance).toFixed(2) : 0,
          exclude_from_balance: excludeFromBalance,
        }, { withCredentials: true });
      }
      
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar cuenta? Asegúrate de que no tenga transacciones ligadas.')) return;
    try {
      await axios.delete(`/api/accounts/${id}`, { withCredentials: true });
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const liquidAccounts = accounts.filter(a => !a.exclude_from_balance);
  const lockedAccounts = accounts.filter(a => a.exclude_from_balance);
  const totalBalance = liquidAccounts.reduce((acc, a) => acc + parseFloat(a.balance), 0);
  const totalLocked = lockedAccounts.reduce((acc, a) => acc + parseFloat(a.balance), 0);

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white">Mis Cuentas</h1>
          </div>
          <button onClick={() => handleOpenModal()} className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Total Summary */}
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50 flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-xl">
            <Wallet className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-sm font-medium">Saldo Líquido</p>
            <h2 className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
              ${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          {lockedAccounts.length > 0 && (
            <div className="text-right">
              <p className="text-slate-500 text-xs font-medium">Retenido</p>
              <p className="text-amber-400 font-bold text-sm">${totalLocked.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>

        {/* List of Accounts */}
        <div className="space-y-3 mt-4">
          {isLoading ? (
            <p className="text-slate-500 text-center py-4">Cargando...</p>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No tienes cuentas registradas.</p>
              <button onClick={() => handleOpenModal()} className="text-emerald-400 mt-2 font-medium">Agregar mi primera cuenta</button>
            </div>
          ) : (
            <>
              {liquidAccounts.length > 0 && (
                <>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-1">Cuentas Líquidas</p>
                  {liquidAccounts.map(acc => (
                    <div key={acc.id} className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl bg-slate-700/30 w-12 h-12 flex items-center justify-center rounded-xl">
                          {TYPE_CONFIG[acc.type].icon}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{acc.name}</h3>
                          <p className={`text-xs ${TYPE_CONFIG[acc.type].color}`}>{TYPE_CONFIG[acc.type].label}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className={`font-bold text-lg ${parseFloat(acc.balance) >= 0 ? 'text-white' : 'text-red-400'}`}>
                          ${Number(acc.balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleOpenModal(acc)} className="text-slate-500 hover:text-emerald-400 p-1">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(acc.id)} className="text-slate-500 hover:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {lockedAccounts.length > 0 && (
                <>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-1 mt-4">Ahorros / Inversiones</p>
                  {lockedAccounts.map(acc => (
                    <div key={acc.id} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl bg-amber-500/10 w-12 h-12 flex items-center justify-center rounded-xl">
                          {TYPE_CONFIG[acc.type].icon}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{acc.name}</h3>
                          <span className="text-xs text-amber-400 font-semibold">🔒 Saldo Retenido</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="font-bold text-lg text-amber-400">
                          ${Number(acc.balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleOpenModal(acc)} className="text-slate-500 hover:text-emerald-400 p-1">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(acc.id)} className="text-slate-500 hover:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-white">{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-lg">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Tarjeta BCP"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'BANK', 'CREDIT_CARD'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        type === t ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-transparent'
                      }`}
                    >
                      <span className="text-lg">{TYPE_CONFIG[t].icon}</span>
                      <span>{t === 'CREDIT_CARD' ? 'Tarjeta' : t === 'BANK' ? 'Banco' : 'Efectivo'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Saldo Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {type === 'CREDIT_CARD' && (
                  <p className="text-xs text-slate-500 mt-1">Si es deuda actual de tarjeta, ingresa el número en negativo (ej. -500).</p>
                )}
              </div>

              {/* Exclude from balance toggle */}
              <button
                type="button"
                onClick={() => setExcludeFromBalance(prev => !prev)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  excludeFromBalance
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">{excludeFromBalance ? '🔒 Saldo Retenido' : '💧 Saldo Líquido'}</p>
                  <p className="text-xs mt-0.5 opacity-70">
                    {excludeFromBalance
                      ? 'Excluida de ingresos/gastos del mes'
                      : 'Incluida en el balance mensual'}
                  </p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-all relative ${
                  excludeFromBalance ? 'bg-amber-500' : 'bg-slate-600'
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    excludeFromBalance ? 'left-5' : 'left-0.5'
                  }`} />
                </div>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl mt-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
