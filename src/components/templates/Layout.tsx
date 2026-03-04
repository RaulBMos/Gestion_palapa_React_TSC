import React from 'react';
import { Home, Calendar, DollarSign, Users, Menu, LogOut } from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, role, isAdmin } = useAuth();

  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home },
    { path: '/reservations', label: 'Reservas', icon: Calendar },
    { path: '/finances', label: 'Finanzas', icon: DollarSign },
    { path: '/clients', label: 'Clientes', icon: Users },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  const isItemActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
        <div className="flex items-center space-x-2">
          <div className="bg-sky-500 p-2 rounded-lg shadow-sm">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">CasaGestión</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.email?.split('@')[0]}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-300'
              }`}>
              {role || 'Viewer'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button className="md:hidden text-slate-500 dark:text-slate-400 p-1">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col p-4 shrink-0 h-full overflow-y-auto">
          <div className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 font-semibold shadow-sm ring-1 ring-sky-200 dark:ring-sky-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase">
                {user?.email?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                <p className={`text-[9px] font-black uppercase tracking-tighter ${isAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {role === 'admin' ? 'Administrador' : 'Observador'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-600">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </nav>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 no-scrollbar scroll-smooth">
          <div className="max-w-5xl mx-auto pb-24 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center pt-1 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-4 w-full transition-colors duration-200 active:scale-95 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                <div className={`p-1 rounded-full mb-0.5 ${isActive ? 'bg-sky-50 dark:bg-sky-900/30' : 'bg-transparent'}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-sky-600/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-sky-700 dark:text-sky-400' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
