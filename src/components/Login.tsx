import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState('gestao@empresa.com');
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Por favor, informe seu usuário ou e-mail.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = dataService.login(identifier, password);
      setLoading(false);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Falha ao autenticar.');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Subtle geometric backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Main card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          {/* Brand header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-600/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Acesso ao Controle de Vendas
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Entre com as credenciais
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/60 border border-red-800/80 flex items-center gap-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="usuario@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Acessar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Controle de Vendas · Sistema Corporativo Seguro
        </div>
      </div>
    </div>
  );
};
