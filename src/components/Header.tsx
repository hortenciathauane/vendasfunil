import React, { useState } from 'react';
import {
  Kanban,
  Users,
  Briefcase,
  CalendarCheck,
  BarChart3,
  LogOut,
  ChevronDown,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';
import { PageTab, Perfil } from '../types';
import { dataService } from '../services/dataService';

interface HeaderProps {
  currentTab: PageTab;
  onTabChange: (tab: PageTab) => void;
  currentUser: Perfil;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isGestao = currentUser.role === 'gestao';
  const allPerfis = dataService.getPerfis();

  // STRICT MENU ORDER:
  // 1. Funil de Vendas
  // 2. Clientes
  // 3. Vendedores (only for Gestão)
  // 4. Atividades
  // 5. Dashboard
  const navItems: { tab: PageTab; label: string; icon: React.ElementType; gestaoOnly?: boolean }[] = [
    { tab: 'funil', label: 'Funil de Vendas', icon: Kanban },
    { tab: 'clientes', label: 'Clientes', icon: Users },
    { tab: 'vendedores', label: 'Vendedores', icon: Briefcase, gestaoOnly: true },
    { tab: 'atividades', label: 'Atividades', icon: CalendarCheck },
    { tab: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  const visibleNav = navItems.filter((item) => !item.gestaoOnly || isGestao);

  const handleSwitchUser = (perfilId: string) => {
    dataService.switchUser(perfilId);
    setProfileDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('funil')}
              className="text-lg font-bold tracking-tight text-white hover:text-blue-400 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span>Controle de Vendas</span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Strict order) */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => onTabChange(item.tab)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-inner font-semibold text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center text-xs font-bold uppercase">
                  {currentUser.nome.charAt(0)}
                </div>
                <div className="hidden sm:block text-xs leading-tight">
                  <div className="font-semibold text-slate-200 truncate max-w-[120px]">
                    {currentUser.nome}
                  </div>
                  <div className="text-slate-400 text-[10px] flex items-center gap-1">
                    <span>{isGestao ? 'Gestão' : 'Vendedor'}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800 text-xs">
                    <p className="font-semibold text-white">{currentUser.nome}</p>
                    <p className="text-slate-400 text-[11px] truncate">{currentUser.email}</p>
                    <div className="mt-1 inline-block text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/50 px-1.5 py-0.5 rounded">
                      Perfil: {isGestao ? 'Gestão Comercial' : 'Vendedor'}
                    </div>
                  </div>

                  {/* Switch user selector */}
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      Alternar Usuário
                    </p>
                    <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                      {allPerfis.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSwitchUser(p.id)}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            p.id === currentUser.id
                              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-medium">{p.nome}</span>
                            <span className="block text-[10px] text-slate-500">{p.cargo}</span>
                          </div>
                          {p.id === currentUser.id && (
                            <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => {
                  onTabChange(item.tab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
