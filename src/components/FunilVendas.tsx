import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
  Building,
  Tag,
  PhoneCall,
} from 'lucide-react';
import {
  Oportunidade,
  EtapaFunil,
  ETAPAS_FUNIL,
  Perfil,
  OrigemLead,
} from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency, formatDate } from '../utils/formatters';

interface FunilVendasProps {
  currentUser: Perfil;
  onOpenClienteDetail?: (clienteId: string) => void;
}

export const FunilVendas: React.FC<FunilVendasProps> = ({ currentUser }) => {
  const isGestao = currentUser.role === 'gestao';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSellerFilter, setSelectedSellerFilter] = useState('todos');
  const [draggedOpId, setDraggedOpId] = useState<string | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Oportunidade | null>(null);
  const [detailOp, setDetailOp] = useState<Oportunidade | null>(null);
  const [lossModalOp, setLossModalOp] = useState<Oportunidade | null>(null);
  const [lossReason, setLossReason] = useState('Orçamento insuficiente');
  const [lossDetails, setLossDetails] = useState('');

  // Quick activity modal on detail
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [activityTipo, setActivityTipo] = useState<'Ligação' | 'Reunião' | 'E-mail' | 'WhatsApp' | 'Follow-up'>('Ligação');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityData, setActivityData] = useState(new Date().toISOString().slice(0, 16));

  // Form State
  const [formTitulo, setFormTitulo] = useState('');
  const [formClienteId, setFormClienteId] = useState('');
  const [formProduto, setFormProduto] = useState('');
  const [formValor, setFormValor] = useState<number>(0);
  const [formResponsavelId, setFormResponsavelId] = useState(currentUser.id);
  const [formOrigem, setFormOrigem] = useState<OrigemLead>('Indicação');
  const [formEtapa, setFormEtapa] = useState<EtapaFunil>('Lead');
  const [formDataPrevista, setFormDataPrevista] = useState('');
  const [formProximaAcao, setFormProximaAcao] = useState('');
  const [formDataProximaAcao, setFormDataProximaAcao] = useState('');

  // Data from service
  const allOportunidades = dataService.getOportunidades();
  const allClientes = dataService.getClientes();
  const sellers = isGestao ? dataService.getPerfis() : [currentUser];

  // Filtering
  const filteredOportunidades = allOportunidades.filter((op) => {
    const client = allClientes.find((c) => c.id === op.cliente_id);
    const clientName = client?.nome || '';
    const company = client?.empresa || '';

    const matchesSearch =
      op.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.produto_servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeller =
      !isGestao ||
      selectedSellerFilter === 'todos' ||
      op.responsavel_id === selectedSellerFilter;

    return matchesSearch && matchesSeller;
  });

  // Calculate totals
  const totalPipelineValue = filteredOportunidades
    .filter((o) => o.etapa !== 'Venda Ganha' && o.etapa !== 'Venda Perdida')
    .reduce((sum, o) => sum + o.valor, 0);

  const totalWonValue = filteredOportunidades
    .filter((o) => o.etapa === 'Venda Ganha')
    .reduce((sum, o) => sum + o.valor, 0);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedOpId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetEtapa: EtapaFunil) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedOpId;
    if (!id) return;

    if (targetEtapa === 'Venda Perdida') {
      const op = dataService.getOportunidadeById(id);
      if (op) {
        setLossModalOp(op);
        setLossReason('Orçamento insuficiente');
        setLossDetails('');
      }
    } else {
      dataService.moveOportunidade(id, targetEtapa);
    }
    setDraggedOpId(null);
  };

  // Form open/save
  const openNewForm = (initialEtapa: EtapaFunil = 'Lead') => {
    setEditingOp(null);
    setFormTitulo('');
    setFormClienteId(allClientes[0]?.id || '');
    setFormProduto('');
    setFormValor(0);
    setFormResponsavelId(isGestao ? sellers[0]?.id || currentUser.id : currentUser.id);
    setFormOrigem('Indicação');
    setFormEtapa(initialEtapa);
    setFormDataPrevista('');
    setFormProximaAcao('');
    setFormDataProximaAcao('');
    setIsFormOpen(true);
  };

  const openEditForm = (op: Oportunidade) => {
    setEditingOp(op);
    setFormTitulo(op.titulo);
    setFormClienteId(op.cliente_id);
    setFormProduto(op.produto_servico);
    setFormValor(op.valor);
    setFormResponsavelId(op.responsavel_id);
    setFormOrigem(op.origem);
    setFormEtapa(op.etapa);
    setFormDataPrevista(op.data_prevista_fechamento || '');
    setFormProximaAcao(op.proxima_acao || '');
    setFormDataProximaAcao(op.data_proxima_acao ? op.data_proxima_acao.slice(0, 10) : '');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClienteId) {
      alert('Selecione um cliente para vincular a oportunidade.');
      return;
    }

    dataService.saveOportunidade({
      id: editingOp?.id,
      titulo: formTitulo,
      cliente_id: formClienteId,
      produto_servico: formProduto,
      valor: Number(formValor),
      responsavel_id: formResponsavelId,
      origem: formOrigem,
      etapa: formEtapa,
      data_prevista_fechamento: formDataPrevista || undefined,
      proxima_acao: formProximaAcao || undefined,
      data_proxima_acao: formDataProximaAcao ? new Date(formDataProximaAcao).toISOString() : undefined,
    });

    setIsFormOpen(false);
  };

  const handleConfirmLoss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossModalOp) return;
    dataService.moveOportunidade(
      lossModalOp.id,
      'Venda Perdida',
      lossReason,
      lossDetails
    );
    setLossModalOp(null);
  };

  const handleDeleteOp = (id: string) => {
    if (confirm('Deseja realmente excluir esta oportunidade?')) {
      dataService.deleteOportunidade(id);
      if (detailOp?.id === id) setDetailOp(null);
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailOp) return;
    dataService.saveAtividade({
      tipo: activityTipo,
      descricao: activityDesc,
      oportunidade_id: detailOp.id,
      cliente_id: detailOp.cliente_id,
      responsavel_id: detailOp.responsavel_id,
      data_hora: new Date(activityData).toISOString(),
      status: 'concluida',
    });
    setActivityDesc('');
    setIsActivityFormOpen(false);
  };

  // Helper colors for stages
  const getEtapaHeaderStyle = (etapa: EtapaFunil) => {
    switch (etapa) {
      case 'Lead':
        return 'border-t-blue-500';
      case 'Contato':
        return 'border-t-sky-500';
      case 'Qualificação':
        return 'border-t-indigo-500';
      case 'Proposta':
        return 'border-t-amber-500';
      case 'Negociação':
        return 'border-t-orange-500';
      case 'Venda Ganha':
        return 'border-t-emerald-500';
      case 'Venda Perdida':
        return 'border-t-rose-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Metrics Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search and filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por oportunidade, cliente, produto..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Seller filter for Gestão */}
            {isGestao && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedSellerFilter}
                  onChange={(e) => setSelectedSellerFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="todos">Todos os Vendedores</option>
                  {sellers
                    .filter((s) => s.role === 'vendedor')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Metrics and CTA */}
          <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
            <div className="flex items-center gap-5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Em Negociação</span>
                <span className="font-mono tabular-nums font-semibold text-white text-sm">
                  {formatCurrency(totalPipelineValue)}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[11px]">Vendido (Ganha)</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-400 text-sm">
                  {formatCurrency(totalWonValue)}
                </span>
              </div>
            </div>

            <button
              onClick={() => openNewForm('Lead')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Oportunidade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scroll) */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="flex gap-4 min-w-[1360px] items-start">
          {ETAPAS_FUNIL.map((etapa) => {
            const etapaOps = filteredOportunidades.filter((o) => o.etapa === etapa);
            const etapaValor = etapaOps.reduce((sum, o) => sum + o.valor, 0);

            return (
              <div
                key={etapa}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, etapa)}
                className={`flex-1 min-w-[270px] max-w-[320px] bg-slate-900/70 border border-slate-800/90 rounded-xl flex flex-col border-t-4 ${getEtapaHeaderStyle(
                  etapa
                )} transition-colors`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100">{etapa}</span>
                      <span className="text-[11px] font-mono tabular-nums bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-medium">
                        {etapaOps.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5 block">
                      {formatCurrency(etapaValor)}
                    </span>
                  </div>

                  <button
                    onClick={() => openNewForm(etapa)}
                    title={`Adicionar oportunidade em ${etapa}`}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards List */}
                <div className="p-2.5 space-y-2.5 min-h-[500px] flex-1">
                  {etapaOps.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-lg flex flex-col items-center justify-center text-slate-600 text-xs text-center p-3">
                      <span>Nenhuma oportunidade</span>
                      <span className="text-[10px] text-slate-700 mt-1">Arraste para cá</span>
                    </div>
                  ) : (
                    etapaOps.map((op) => {
                      const client = allClientes.find((c) => c.id === op.cliente_id);
                      const seller = dataService.getPerfilById(op.responsavel_id);

                      return (
                        <div
                          key={op.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, op.id)}
                          onClick={() => setDetailOp(op)}
                          className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                        >
                          {/* Client & Company */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="truncate">
                              <p className="text-xs font-semibold text-white truncate">
                                {client?.empresa || 'Empresa não informada'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {client?.nome || 'Contato'}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditForm(op);
                              }}
                              className="text-slate-500 hover:text-slate-300 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Product/Service Title */}
                          <div className="mt-2 text-xs font-medium text-slate-300 line-clamp-2">
                            {op.produto_servico}
                          </div>

                          {/* Value */}
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-sm font-semibold font-mono tabular-nums text-white">
                              {formatCurrency(op.valor)}
                            </span>
                            {op.origem && (
                              <span className="text-[10px] text-slate-400">
                                {op.origem}
                              </span>
                            )}
                          </div>

                          {/* Next Action or Loss Reason */}
                          {op.etapa === 'Venda Perdida' ? (
                            <div className="mt-2.5 pt-2 border-t border-slate-900 text-[11px] text-rose-400 flex items-start gap-1.5">
                              <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="truncate">
                                {op.motivo_perda || 'Perda registrada'}
                              </span>
                            </div>
                          ) : op.proxima_acao ? (
                            <div className="mt-2.5 pt-2 border-t border-slate-900 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                              <ArrowRight className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="truncate">{op.proxima_acao}</span>
                            </div>
                          ) : null}

                          {/* Card Footer: Seller & Date */}
                          <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="truncate max-w-[130px]" title={seller?.nome}>
                              {seller?.nome ? seller.nome.split(' ')[0] : '—'}
                            </span>
                            {op.data_prevista_fechamento && (
                              <span className="font-mono tabular-nums">
                                Prev: {formatDate(op.data_prevista_fechamento)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Opportunity Form Modal (Create / Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingOp ? 'Editar Oportunidade' : 'Nova Oportunidade'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Título da Negociação *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Contrato Anual TechLog"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Cliente Vinculado *
                  </label>
                  <select
                    required
                    value={formClienteId}
                    onChange={(e) => setFormClienteId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione um cliente...</option>
                    {allClientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.empresa} ({c.nome})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Produto / Serviço *
                  </label>
                  <input
                    type="text"
                    required
                    value={formProduto}
                    onChange={(e) => setFormProduto(e.target.value)}
                    placeholder="Ex: Licença Software ERP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formValor}
                    onChange={(e) => setFormValor(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Etapa Atual *
                  </label>
                  <select
                    value={formEtapa}
                    onChange={(e) => setFormEtapa(e.target.value as EtapaFunil)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {ETAPAS_FUNIL.map((et) => (
                      <option key={et} value={et}>
                        {et}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Origem do Lead
                  </label>
                  <select
                    value={formOrigem}
                    onChange={(e) => setFormOrigem(e.target.value as OrigemLead)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Indicação">Indicação</option>
                    <option value="Google/Site">Google/Site</option>
                    <option value="Redes Sociais">Redes Sociais</option>
                    <option value="Evento">Evento</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Responsável
                  </label>
                  {isGestao ? (
                    <select
                      value={formResponsavelId}
                      onChange={(e) => setFormResponsavelId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} ({s.cargo})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={currentUser.nome}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Previsão de Fechamento
                  </label>
                  <input
                    type="date"
                    value={formDataPrevista}
                    onChange={(e) => setFormDataPrevista(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Data da Próxima Ação
                  </label>
                  <input
                    type="date"
                    value={formDataProximaAcao}
                    onChange={(e) => setFormDataProximaAcao(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Próxima Ação
                </label>
                <input
                  type="text"
                  value={formProximaAcao}
                  onChange={(e) => setFormProximaAcao(e.target.value)}
                  placeholder="Ex: Enviar proposta comercial atualizada"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Salvar Oportunidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loss Reason Modal */}
      {lossModalOp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Registrar Perda da Venda</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Informe o motivo da perda para alimentar os relatórios de conversão e análise de funil.
            </p>

            <form onSubmit={handleConfirmLoss} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Motivo da Perda *
                </label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Orçamento insuficiente">Orçamento insuficiente</option>
                  <option value="Preço / Concorrência">Preço / Concorrência</option>
                  <option value="Falta de recursos do produto">Falta de recursos do produto</option>
                  <option value="Perda de timing / Prioridade postergada">Perda de timing / Prioridade postergada</option>
                  <option value="Cliente desistiu do projeto">Cliente desistiu do projeto</option>
                  <option value="Outro motivo">Outro motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Observações adicionais
                </label>
                <textarea
                  rows={3}
                  value={lossDetails}
                  onChange={(e) => setLossDetails(e.target.value)}
                  placeholder="Detalhes ou justificativa fornecida pelo cliente..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLossModalOp(null)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirmar Perda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Opportunity Detail Drawer / Modal */}
      {detailOp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono tabular-nums text-blue-400 uppercase tracking-wider font-semibold">
                  {detailOp.etapa}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{detailOp.titulo}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Produto / Serviço: <strong className="text-slate-200">{detailOp.produto_servico}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const op = detailOp;
                    setDetailOp(null);
                    openEditForm(op);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteOp(detailOp.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setDetailOp(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick overview */}
            {(() => {
              const client = allClientes.find((c) => c.id === detailOp.cliente_id);
              const seller = dataService.getPerfilById(detailOp.responsavel_id);
              const linkedActivities = dataService
                .getAtividades()
                .filter((a) => a.oportunidade_id === detailOp.id);

              return (
                <div className="mt-5 space-y-6">
                  {/* Grid info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Valor da Venda</span>
                      <span className="text-base font-bold font-mono tabular-nums text-white">
                        {formatCurrency(detailOp.valor)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Cliente</span>
                      <span className="text-xs font-semibold text-slate-200 truncate block">
                        {client?.empresa || 'Não informado'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {client?.nome}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Responsável</span>
                      <span className="text-xs font-medium text-slate-200 block">
                        {seller?.nome || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Origem</span>
                      <span className="text-xs text-slate-300 block">{detailOp.origem}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Previsão Fechamento</span>
                      <span className="text-xs font-mono tabular-nums text-slate-300 block">
                        {formatDate(detailOp.data_prevista_fechamento)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Último Contato</span>
                      <span className="text-xs font-mono tabular-nums text-slate-300 block">
                        {formatDate(detailOp.ultimo_contato)}
                      </span>
                    </div>
                  </div>

                  {/* Move stage quick actions */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Movimentar Etapa
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ETAPAS_FUNIL.map((et) => {
                        const isCurrent = detailOp.etapa === et;
                        return (
                          <button
                            key={et}
                            onClick={() => {
                              if (et === 'Venda Perdida') {
                                setLossModalOp(detailOp);
                              } else {
                                dataService.moveOportunidade(detailOp.id, et);
                                setDetailOp({ ...detailOp, etapa: et });
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                            }`}
                          >
                            {et}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Loss reason display if lost */}
                  {detailOp.etapa === 'Venda Perdida' && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl">
                      <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Motivo da Perda: {detailOp.motivo_perda || 'Não informado'}</span>
                      </div>
                      {detailOp.motivo_perda_detalhes && (
                        <p className="text-xs text-rose-200/80 mt-1 pl-6">
                          {detailOp.motivo_perda_detalhes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Next Action */}
                  {detailOp.proxima_acao && (
                    <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                        Próxima Ação
                      </span>
                      <p className="text-xs text-slate-200 mt-1">{detailOp.proxima_acao}</p>
                    </div>
                  )}

                  {/* Activities History for this opportunity */}
                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Histórico de Atividades ({linkedActivities.length})
                      </h4>
                      <button
                        onClick={() => setIsActivityFormOpen(!isActivityFormOpen)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Registrar Atividade</span>
                      </button>
                    </div>

                    {/* Quick activity form */}
                    {isActivityFormOpen && (
                      <form onSubmit={handleAddActivity} className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={activityTipo}
                            onChange={(e) => setActivityTipo(e.target.value as any)}
                            className="bg-slate-900 border border-slate-800 rounded text-xs px-2 py-1.5 text-white"
                          >
                            <option value="Ligação">Ligação</option>
                            <option value="Reunião">Reunião</option>
                            <option value="E-mail">E-mail</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Follow-up">Follow-up</option>
                          </select>
                          <input
                            type="datetime-local"
                            value={activityData}
                            onChange={(e) => setActivityData(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded text-xs px-2 py-1.5 text-white"
                          />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Descrição da atividade realizada..."
                          value={activityDesc}
                          onChange={(e) => setActivityDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded text-xs px-2.5 py-2 text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsActivityFormOpen(false)}
                            className="text-xs text-slate-400 px-2 py-1"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1 rounded"
                          >
                            Salvar
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Activities List */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {linkedActivities.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">
                          Nenhuma atividade registrada nesta oportunidade.
                        </p>
                      ) : (
                        linkedActivities.map((a) => (
                          <div
                            key={a.id}
                            className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg flex items-start justify-between text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-blue-400 text-[11px]">
                                  {a.tipo}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                                  {formatDate(a.data_hora)}
                                </span>
                              </div>
                              <p className="text-slate-300">{a.descricao}</p>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                a.status === 'concluida'
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
