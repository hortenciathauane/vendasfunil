import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  PieChart,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { Perfil, EtapaFunil, ETAPAS_FUNIL, IndicadoresConsolidados } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency } from '../utils/formatters';

interface DashboardProps {
  currentUser: Perfil;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const isGestao = currentUser.role === 'gestao';

  // Filters
  const [periodoDias, setPeriodoDias] = useState<number | undefined>(undefined);
  const [responsavelId, setResponsavelId] = useState<string>('todos');
  const [etapaFilter, setEtapaFilter] = useState<EtapaFunil | undefined>(undefined);
  const [origemFilter, setOrigemFilter] = useState<string | undefined>(undefined);

  // For seller: toggle between individual vs consolidated team view
  const [vendedorViewMode, setVendedorViewMode] = useState<'individual' | 'consolidado'>('individual');

  const sellers = isGestao ? dataService.getPerfis().filter((p) => p.role === 'vendedor') : [];

  const { userStats, teamStats, canViewTeamBreakdown } = dataService.getIndicadores({
    periodoDias,
    responsavelId: isGestao ? responsavelId : currentUser.id,
    etapa: etapaFilter,
    origem: origemFilter,
  });

  // Effective stats to show
  const activeStats: IndicadoresConsolidados = isGestao
    ? userStats
    : vendedorViewMode === 'individual'
    ? userStats
    : teamStats;

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros:</span>
            </span>

            {/* Período */}
            <select
              value={periodoDias === undefined ? 'todos' : periodoDias}
              onChange={(e) => {
                const val = e.target.value;
                setPeriodoDias(val === 'todos' ? undefined : parseInt(val));
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="todos">Todo o Período</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias (Trimestre)</option>
              <option value="365">Último Ano</option>
            </select>

            {/* Responsável Filter (Exclusively for Gestão) */}
            {isGestao && (
              <select
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="todos">Toda a Equipe</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            )}

            {/* Etapa Filter */}
            <select
              value={etapaFilter || 'todas'}
              onChange={(e) => {
                const val = e.target.value;
                setEtapaFilter(val === 'todas' ? undefined : (val as EtapaFunil));
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="todas">Todas as Etapas</option>
              {ETAPAS_FUNIL.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>

            {/* Origem Filter */}
            <select
              value={origemFilter || 'todas'}
              onChange={(e) => {
                const val = e.target.value;
                setOrigemFilter(val === 'todas' ? undefined : val);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="todas">Todas as Origens</option>
              <option value="Indicação">Indicação</option>
              <option value="Google/Site">Google/Site</option>
              <option value="Redes Sociais">Redes Sociais</option>
              <option value="Evento">Evento</option>
              <option value="Outbound">Outbound</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          {/* If Vendedor: View mode switcher (Individual vs Consolidated) */}
          {!isGestao && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start lg:self-auto">
              <button
                onClick={() => setVendedorViewMode('individual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  vendedorViewMode === 'individual'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Meu Desempenho
              </button>
              <button
                onClick={() => setVendedorViewMode('consolidado')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  vendedorViewMode === 'consolidado'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Geral da Equipe (Consolidado)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Leads */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">Total de Leads</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {activeStats.total_leads}
            </span>
            <span className="text-xs text-slate-400">oportunidades</span>
          </div>
        </div>

        {/* Oportunidades Abertas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">Em Negociação (Abertas)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-400">
              {activeStats.oportunidades_abertas}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {formatCurrency(activeStats.valor_negociacao)}
            </span>
          </div>
        </div>

        {/* Vendas Ganhas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">Vendas Ganhas</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {activeStats.vendas_ganhas}
            </span>
            <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
              {formatCurrency(activeStats.valor_vendido)}
            </span>
          </div>
        </div>

        {/* Vendas Perdidas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">Vendas Perdidas</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-400">
              {activeStats.vendas_perdidas}
            </span>
            <span className="text-xs text-slate-400">descartadas</span>
          </div>
        </div>

        {/* Valor em Negociação */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">Valor em Negociação</span>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-200">
              {formatCurrency(activeStats.valor_negociacao)}
            </span>
          </div>
        </div>

        {/* Valor Vendido */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">Valor Total Vendido</span>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
              {formatCurrency(activeStats.valor_vendido)}
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">Ticket Médio</span>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-200">
              {formatCurrency(activeStats.ticket_medio)}
            </span>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block">Taxa de Conversão</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-400">
              {activeStats.taxa_conversao.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">ganhas / fechadas</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversão por Etapa (Funil de Vendas) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Conversão por Etapa do Funil</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {activeStats.total_leads} negócios
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {activeStats.distribuicao_etapas.map((item) => {
              const maxLeads = Math.max(...activeStats.distribuicao_etapas.map((d) => d.quantidade), 1);
              const percent = (item.quantidade / maxLeads) * 100;
              const isWon = item.etapa === 'Venda Ganha';
              const isLost = item.etapa === 'Venda Perdida';

              return (
                <div key={item.etapa} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{item.etapa}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                        {formatCurrency(item.valor_total)}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-white w-6 text-right">
                        {item.quantidade}
                      </span>
                    </div>
                  </div>

                  {/* Funnel Bar */}
                  <div className="w-full bg-slate-950 rounded-md h-3 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-md transition-all ${
                        isWon
                          ? 'bg-emerald-500'
                          : isLost
                          ? 'bg-rose-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(4, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivos de Perda & Origem de Vendas */}
        <div className="space-y-6">
          {/* Motivos de Perda */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Motivos de Perda de Vendas</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                {activeStats.vendas_perdidas} perda(s)
              </span>
            </div>

            <div className="mt-4">
              {activeStats.motivos_perda.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Nenhuma perda registrada no período selecionado.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeStats.motivos_perda.map((m) => {
                    const pct = activeStats.vendas_perdidas > 0
                      ? (m.total / activeStats.vendas_perdidas) * 100
                      : 0;

                    return (
                      <div key={m.motivo} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 truncate max-w-[200px]">
                            {m.motivo}
                          </span>
                          <span className="font-mono tabular-nums text-rose-400 font-semibold">
                            {m.total} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded h-2 overflow-hidden border border-slate-800/80">
                          <div
                            className="bg-rose-500/80 h-full rounded"
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vendas por Origem */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Oportunidades por Origem</span>
              </h3>
            </div>

            <div className="mt-4 space-y-2.5">
              {activeStats.distribuicao_origem.map((o) => (
                <div
                  key={o.origem}
                  className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <span className="font-medium text-slate-200">{o.origem}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono tabular-nums text-slate-400">
                      {formatCurrency(o.valor_total)}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {o.quantidade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
