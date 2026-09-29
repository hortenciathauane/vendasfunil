import React, { useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Video,
  Mail,
  MessageSquare,
  Repeat,
  Calendar,
  Filter,
  Trash2,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';
import { Atividade, TipoAtividade, StatusAtividade, Perfil } from '../types';
import { dataService } from '../services/dataService';
import { formatDate, formatDateTime, isPastDate } from '../utils/formatters';

interface AtividadesProps {
  currentUser: Perfil;
}

export const Atividades: React.FC<AtividadesProps> = ({ currentUser }) => {
  const isGestao = currentUser.role === 'gestao';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusAtividade>('todos');
  const [tipoFilter, setTipoFilter] = useState<'todos' | TipoAtividade>('todos');
  const [sellerFilter, setSellerFilter] = useState('todos');

  // Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAtiv, setEditingAtiv] = useState<Atividade | null>(null);

  // Form
  const [formTipo, setFormTipo] = useState<TipoAtividade>('Ligação');
  const [formDescricao, setFormDescricao] = useState('');
  const [formClienteId, setFormClienteId] = useState('');
  const [formOportunidadeId, setFormOportunidadeId] = useState('');
  const [formDataHora, setFormDataHora] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [formProximaAcao, setFormProximaAcao] = useState('');
  const [formStatus, setFormStatus] = useState<StatusAtividade>('pendente');
  const [formResponsavelId, setFormResponsavelId] = useState(currentUser.id);

  const atividades = dataService.getAtividades();
  const clientes = dataService.getClientes();
  const oportunidades = dataService.getOportunidades();
  const sellers = isGestao ? dataService.getPerfis() : [currentUser];

  // Helper to compute effective status
  const getComputedStatus = (a: Atividade): StatusAtividade => {
    if (a.status === 'concluida') return 'concluida';
    if (isPastDate(a.data_hora)) return 'atrasada';
    return 'pendente';
  };

  // Filtered List
  const filteredAtividades = atividades.filter((a) => {
    const computedStatus = getComputedStatus(a);
    const client = clientes.find((c) => c.id === a.cliente_id);
    const clientName = client?.empresa || client?.nome || '';

    const matchesSearch =
      a.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.proxima_acao && a.proxima_acao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || computedStatus === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || a.tipo === tipoFilter;
    const matchesSeller = !isGestao || sellerFilter === 'todos' || a.responsavel_id === sellerFilter;

    return matchesSearch && matchesStatus && matchesTipo && matchesSeller;
  });

  const getTipoIcon = (tipo: TipoAtividade) => {
    switch (tipo) {
      case 'Ligação':
        return <Phone className="w-4 h-4 text-sky-400" />;
      case 'Reunião':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'E-mail':
        return <Mail className="w-4 h-4 text-amber-400" />;
      case 'WhatsApp':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'Follow-up':
        return <Repeat className="w-4 h-4 text-indigo-400" />;
    }
  };

  const openNewForm = () => {
    setEditingAtiv(null);
    setFormTipo('Ligação');
    setFormDescricao('');
    setFormClienteId(clientes[0]?.id || '');
    setFormOportunidadeId('');
    setFormDataHora(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
    setFormProximaAcao('');
    setFormStatus('pendente');
    setFormResponsavelId(isGestao ? sellers[0]?.id || currentUser.id : currentUser.id);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.saveAtividade({
      id: editingAtiv?.id,
      tipo: formTipo,
      descricao: formDescricao,
      cliente_id: formClienteId || undefined,
      oportunidade_id: formOportunidadeId || undefined,
      data_hora: new Date(formDataHora).toISOString(),
      proxima_acao: formProximaAcao || undefined,
      status: formStatus,
      responsavel_id: formResponsavelId,
    });
    setIsFormOpen(false);
  };

  const handleToggleConcluida = (id: string) => {
    dataService.toggleAtividadeStatus(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta atividade?')) {
      dataService.deleteAtividade(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar atividade, cliente ou descrição..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="atrasada">Atrasadas</option>
              <option value="concluida">Concluídas</option>
            </select>

            {/* Filter by Tipo */}
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="Ligação">Ligações</option>
              <option value="Reunião">Reuniões</option>
              <option value="E-mail">E-mails</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Follow-up">Follow-ups</option>
            </select>

            {/* Seller filter for Gestão */}
            {isGestao && (
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="todos">Toda a Equipe</option>
                {sellers
                  .filter((s) => s.role === 'vendedor')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
              </select>
            )}
          </div>

          <button
            onClick={openNewForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Atividade</span>
          </button>
        </div>
      </div>

      {/* List of Activities */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredAtividades.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">Nenhuma atividade localizada</p>
            <p className="text-xs text-slate-500 mt-1">
              Agende ligações, reuniões e follow-ups para acompanhar seus clientes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredAtividades.map((a) => {
              const computedStatus = getComputedStatus(a);
              const client = clientes.find((c) => c.id === a.cliente_id);
              const op = oportunidades.find((o) => o.id === a.oportunidade_id);
              const seller = dataService.getPerfilById(a.responsavel_id);

              return (
                <div
                  key={a.id}
                  className="p-4 hover:bg-slate-850/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Complete check + details */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      onClick={() => handleToggleConcluida(a.id)}
                      title={computedStatus === 'concluida' ? 'Marcar como pendente' : 'Marcar como concluída'}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        computedStatus === 'concluida'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-700 bg-slate-950 text-transparent hover:border-slate-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                          {getTipoIcon(a.tipo)}
                          <span>{a.tipo}</span>
                        </div>

                        {/* Status Label (Clean unboxed with dot separator) */}
                        <span className="text-slate-600">·</span>
                        {computedStatus === 'concluida' && (
                          <span className="text-xs text-emerald-400 font-medium">Concluída</span>
                        )}
                        {computedStatus === 'atrasada' && (
                          <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Atrasada
                          </span>
                        )}
                        {computedStatus === 'pendente' && (
                          <span className="text-xs text-amber-400 font-medium">Pendente</span>
                        )}

                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          {formatDateTime(a.data_hora)}
                        </span>
                      </div>

                      <p
                        className={`text-sm ${
                          computedStatus === 'concluida'
                            ? 'line-through text-slate-500'
                            : 'text-slate-200'
                        }`}
                      >
                        {a.descricao}
                      </p>

                      {/* Client & Deal references */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        {client && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            <strong>{client.empresa}</strong> ({client.nome})
                          </span>
                        )}
                        {op && (
                          <span className="text-slate-400">
                            Negócio: <span className="text-blue-400">{op.titulo}</span>
                          </span>
                        )}
                        {isGestao && seller && (
                          <span className="text-slate-500">
                            Resp: <span className="text-slate-400">{seller.nome}</span>
                          </span>
                        )}
                      </div>

                      {/* Next action hint */}
                      {a.proxima_acao && (
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                          <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>Próximo passo: {a.proxima_acao}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Excluir atividade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Activity Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Registrar Atividade</h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Tipo de Atividade *
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoAtividade)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Ligação">Ligação</option>
                    <option value="Reunião">Reunião</option>
                    <option value="E-mail">E-mail</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Data e Horário *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDataHora}
                    onChange={(e) => setFormDataHora(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Descrição da Atividade *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Resumo do contato, pontos discutidos ou pauta da reunião..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Cliente Vinculado
                  </label>
                  <select
                    value={formClienteId}
                    onChange={(e) => setFormClienteId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Nenhum</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.empresa} ({c.nome})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Oportunidade (Funil)
                  </label>
                  <select
                    value={formOportunidadeId}
                    onChange={(e) => setFormOportunidadeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Nenhuma</option>
                    {oportunidades.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Próxima Ação
                  </label>
                  <input
                    type="text"
                    value={formProximaAcao}
                    onChange={(e) => setFormProximaAcao(e.target.value)}
                    placeholder="Ex: Enviar minuta revisada"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StatusAtividade)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
              </div>

              {isGestao && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Responsável
                  </label>
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
                </div>
              )}

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
                  Salvar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
