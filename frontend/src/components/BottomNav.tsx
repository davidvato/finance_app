import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Tag, ShieldCheck, LogOut, Target, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
    { to: '/accounts', icon: Wallet, label: 'Cuentas' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Movimientos' },
    { to: '/categories', icon: Tag, label: 'Categorías' },
    { to: '/budgets', icon: Target, label: 'Presupuestos' },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50">
      <div className="max-w-md mx-auto flex items-center justify-around px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                  <Icon className={`w-5 h-5 ${isActive && to === '/admin' ? 'text-amber-400' : ''}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive && to === '/admin' ? 'text-amber-400' : ''}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-3 px-4 rounded-xl text-slate-500 hover:text-red-400 transition-all duration-200 min-w-[60px]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Salir</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
