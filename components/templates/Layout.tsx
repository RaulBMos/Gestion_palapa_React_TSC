import React from 'react';
import { Home, Calendar, DollarSign, Users, Menu } from 'lucide-react';
import { ViewState } from '../../src/types';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'reservations', label: 'Reservas', icon: Calendar },
    { id: 'finances', label: 'Finanzas', icon: DollarSign },
    { id: 'clients', label: 'Clientes', icon: Users },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
        <div className="flex items-center space-x-2">
          <div className="bg-sky-500 p-2 rounded-lg shadow-sm">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">CasaGestión</h1>
        </div>
        <button className="md:hidden text-slate-500 p-1">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col p-4 shrink-0 h-full overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as ViewState)}
                  className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-sky-50 text-sky-700 font-semibold shadow-sm ring-1 ring-sky-200' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 no-scrollbar scroll-smooth">
          <div className="max-w-5xl mx-auto pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center pt-1 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className={`flex flex-col items-center py-2 px-4 w-full transition-colors duration-200 active:scale-95 ${
                  isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1 rounded-full mb-0.5 ${isActive ? 'bg-sky-50' : 'bg-transparent'}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-sky-600/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-sky-700' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};