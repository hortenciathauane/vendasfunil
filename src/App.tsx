/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageTab, Perfil } from './types';
import { dataService } from './services/dataService';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { FunilVendas } from './components/FunilVendas';
import { Clientes } from './components/Clientes';
import { Vendedores } from './components/Vendedores';
import { Atividades } from './components/Atividades';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Perfil | null>(() =>
    dataService.getCurrentUser()
  );
  const [currentTab, setCurrentTab] = useState<PageTab>('funil');

  // Subscribe to dataService updates
  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      const user = dataService.getCurrentUser();
      setCurrentUser(user ? { ...user } : null);
    });
    return unsubscribe;
  }, []);

  // If role is vendedor, forbid access to vendedores tab
  useEffect(() => {
    if (currentUser && currentUser.role === 'vendedor' && currentTab === 'vendedores') {
      setCurrentTab('funil');
    }
  }, [currentUser, currentTab]);

  const handleLogout = () => {
    dataService.logout();
    setCurrentUser(null);
  };

  // If not authenticated, show clean Login screen
  if (!currentUser) {
    return <Login onSuccess={() => setCurrentUser(dataService.getCurrentUser())} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Strict 1-row, 3-zone Header Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'funil' && <FunilVendas currentUser={currentUser} />}
        {currentTab === 'clientes' && <Clientes currentUser={currentUser} />}
        {currentTab === 'vendedores' && <Vendedores currentUser={currentUser} />}
        {currentTab === 'atividades' && <Atividades currentUser={currentUser} />}
        {currentTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
      </main>
    </div>
  );
}
