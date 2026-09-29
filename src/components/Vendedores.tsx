import React, { useState } from 'react';
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit2,
  TrendingUp,
  Target,
  DollarSign,
  Award,
  Shield,
  Briefcase,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { Perfil, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency } from '../utils/formatters';

interface VendedoresProps {
  currentUser: Perfil;
}

export const Vendedores: React.FC<VendedoresProps> = ({ currentUser }) => {
  const isGestao = currentUser.role === 'gestao';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | 'vendedor' | 'gestao'>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);

  // Form State
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formCargo, setFormCargo] = useState('Executivo de Vendas');
  const [formRole, setFormRole] = useState<UserRole>('vendedor');
  const [formMeta, setFormMeta] = useState<number>(45000);
  const [formAtivo, setFormAtivo] = useState(true);

  if (!isGestao) {
    return (
      <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-xl p-6">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Acesso Restrito à Gestão</h2>
        <p className="text-xs text-slate-400 mt-1">
          Apenas usuários com perfil de Gestão possuem permissão para gerenciar vendedores e equipes.
        </p>
      </div>
    );
  }

  const perfis = dataService.getPerfis();
  const desempenhoList = dataService.getDesempenhoVendedores();

  const filteredPerfis = perfis.filter((p) => {
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cargo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'todos' || p.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const openNewForm = () => {
    setEditingPerfil(null);
    setFormNome('');
    setFormEmail('');
    setFormTelefone('');
    setFormCargo('Executivo de Vendas');
    setFormRole('vendedor');
    setFormMeta(45000);
    setFormAtivo(true);
    setIsFormOpen(true);
  };

  const openEditForm = (p: Perfil) => {
    setEditingPerfil(p);
    setFormNome(p.nome);
    setFormEmail(p.email);
    setFormTelefone(p.telefone || '');
    setFormCargo(p.cargo);
    setFormRole(p.role);
    setFormMeta(p.meta_mensal || 45000);
    setFormAtivo(p.ativo);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.savePerfil({
      id: editingPerfil?.id,
      nome: formNome,
      email: formEmail,
      telefone: formTelefone,
      cargo: formCargo,
      role: formRole,
      meta_mensal: Number(formMeta),
      ativo: formAtivo,
    });
    setIsFormOpen(false);
  };

  const handleToggleAtivo = (id: string) => {
    dataService.togglePerfilAtivo(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar vendedor por nome, e-mail, cargo..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="todos">Todos os Perfis</option>
              <option value="vendedor">Apenas Vendedores</option>
              <option value="gestao">Apenas Gestão</option>
            </select>
          </div>

          <button
            onClick={openNewForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Usuário</span>
          </button>
        </div>
      </div>

      {/* Sellers Cards with Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPerfis.map((perfil) => {
          const stats = desempenhoList.find((d) => d.perfil.id === perfil.id);
          const isMe = perfil.id === currentUser.id;

          return (
            <div
              key={perfil.id}
              className={`bg-slate-900 border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                perfil.ativo
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/50 opacity-60 bg-slate-950/40'
              }`}
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase ${
                        perfil.role === 'gestao'
                          ? 'bg-purple-950 border border-purple-800/80 text-purple-300'
                          : 'bg-blue-950 border border-blue-800/80 text-blue-300'
                      }`}
                    >
                      {perfil.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{perfil.nome}</span>
                        {isMe && (
                          <span className="text-[10px] text-blue-400 font-normal">
                            (Você)
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">{perfil.cargo}</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      perfil.ativo
                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                        : 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                    }`}
                  >
                    {perfil.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Contact data */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{perfil.email}</span>
                  </div>
                  {perfil.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono tabular-nums">{perfil.telefone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Perfil de Acesso: <strong className="text-slate-200 capitalize">{perfil.role}</strong></span>
                  </div>
                </div>

                {/* Performance stats if seller */}
                {perfil.role === 'vendedor' && stats && (
                  <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2.5">
                    {/* Meta Progress */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Meta Mensal</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-200">
                          {formatCurrency(perfil.meta_mensal)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, stats.percentMeta)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>Atingido: {stats.percentMeta.toFixed(1)}%</span>
                        <span className="font-mono tabular-nums font-medium text-emerald-400">
                          Vendido: {formatCurrency(stats.valorVendido)}
                        </span>
                      </div>
                    </div>

                    {/* Numerical figures */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Abertas</span>
                        <span className="text-xs font-bold font-mono tabular-nums text-slate-200">
                          {stats.oportunidadesAbertas}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Ganha</span>
                        <span className="text-xs font-bold font-mono tabular-nums text-emerald-400">
                          {stats.vendasGanhas}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Conversão</span>
                        <span className="text-xs font-bold font-mono tabular-nums text-blue-400">
                          {stats.taxaConversao.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(perfil.id)}
                  disabled={isMe}
                  className={`text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    perfil.ativo
                      ? 'text-rose-400 hover:bg-rose-950/30'
                      : 'text-emerald-400 hover:bg-emerald-950/30'
                  }`}
                >
                  {perfil.ativo ? (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>Desativar</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ativar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => openEditForm(perfil)}
                  className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingPerfil ? 'Editar Usuário / Vendedor' : 'Cadastrar Vendedor / Usuário'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Nome do profissional"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="Ex: Executivo de Contas"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Perfil de Acesso *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="gestao">Gestão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Meta Mensal (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formMeta}
                    onChange={(e) => setFormMeta(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950"
                />
                <label htmlFor="ativo" className="text-xs text-slate-300">
                  Usuário ativo no sistema (permite efetuar login)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
