import React, { useState } from 'react';
import {
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  User,
  MoreVertical,
  Calendar,
  FileText,
  Briefcase,
  CalendarCheck,
  Trash2,
  Edit2,
  ChevronRight,
} from 'lucide-react';
import { Cliente, Perfil, OrigemLead } from '../types';
import { dataService } from '../services/dataService';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ClientesProps {
  currentUser: Perfil;
  onOpenOpportunityDetail?: (opId: string) => void;
}

export const Clientes: React.FC<ClientesProps> = ({ currentUser }) => {
  const isGestao = currentUser.role === 'gestao';

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [origemFilter, setOrigemFilter] = useState('todas');

  // Modals & Selection
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Form Fields
  const [formNome, setFormNome] = useState('');
  const [formEmpresa, setFormEmpresa] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formOrigem, setFormOrigem] = useState<OrigemLead>('Indicação');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formResponsavelId, setFormResponsavelId] = useState(currentUser.id);

  const clientes = dataService.getClientes();
  const sellers = isGestao ? dataService.getPerfis() : [currentUser];

  // Filtered
  const filteredClientes = clientes.filter((c) => {
    const matchesSearch =
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOrigem = origemFilter === 'todas' || c.origem === origemFilter;

    return matchesSearch && matchesOrigem;
  });

  const openNewForm = () => {
    setEditingCliente(null);
    setFormNome('');
    setFormEmpresa('');
    setFormTelefone('');
    setFormEmail('');
    setFormOrigem('Indicação');
    setFormObservacoes('');
    setFormResponsavelId(isGestao ? sellers[0]?.id || currentUser.id : currentUser.id);
    setIsFormOpen(true);
  };

  const openEditForm = (c: Cliente) => {
    setEditingCliente(c);
    setFormNome(c.nome);
    setFormEmpresa(c.empresa);
    setFormTelefone(c.telefone);
    setFormEmail(c.email);
    setFormOrigem(c.origem);
    setFormObservacoes(c.observacoes || '');
    setFormResponsavelId(c.responsavel_id);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = dataService.saveCliente({
      id: editingCliente?.id,
      nome: formNome,
      empresa: formEmpresa,
      telefone: formTelefone,
      email: formEmail,
      origem: formOrigem,
      observacoes: formObservacoes,
      responsavel_id: formResponsavelId,
    });

    setIsFormOpen(false);
    if (selectedCliente?.id === saved.id) {
      setSelectedCliente(saved);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Atenção: Ao excluir este cliente, todas as oportunidades e atividades vinculadas a ele também serão removidas. Deseja prosseguir?')) {
      dataService.deleteCliente(id);
      if (selectedCliente?.id === id) {
        setSelectedCliente(null);
      }
    }
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
                placeholder="Buscar por nome, empresa, e-mail, telefone..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={origemFilter}
              onChange={(e) => setOrigemFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Total: <strong>{filteredClientes.length}</strong> clientes
            </span>
            <button
              onClick={openNewForm}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">Nenhum cliente localizado</p>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre novos clientes para iniciar o fluxo do funil de vendas.
            </p>
            <button
              onClick={openNewForm}
              className="mt-4 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Primeiro Cliente</span>
            </button>
          </div>
        ) : (
          filteredClientes.map((c) => {
            const seller = dataService.getPerfilById(c.responsavel_id);
            const clientOps = dataService.getOportunidades().filter((o) => o.cliente_id === c.id);
            const activeDealsValue = clientOps
              .filter((o) => o.etapa !== 'Venda Perdida')
              .reduce((sum, o) => sum + o.valor, 0);

            return (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Company & Origin */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-white truncate">
                        {c.empresa}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {c.nome}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
                      {c.origem}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{c.telefone || 'Telefone não cadastrado'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{c.email || 'E-mail não cadastrado'}</span>
                    </div>
                  </div>

                  {/* Notes snippet */}
                  {c.observacoes && (
                    <p className="mt-3 text-[11px] text-slate-400 line-clamp-2 italic bg-slate-950/60 p-2 rounded border border-slate-800/60">
                      "{c.observacoes}"
                    </p>
                  )}
                </div>

                {/* Bottom stats and Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-400 text-[11px]">
                      {clientOps.length} negócio(s)
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-200">
                      {formatCurrency(activeDealsValue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      Resp: {seller?.nome ? seller.nome.split(' ')[0] : '—'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedCliente(c)}
                        className="px-2.5 py-1 text-xs text-blue-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        Histórico
                      </button>
                      <button
                        onClick={() => openEditForm(c)}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Client Detail / History Modal */}
      {selectedCliente && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono tabular-nums text-blue-400 uppercase tracking-wider font-semibold">
                  Registro de Cliente
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedCliente.empresa}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contato Principal: <strong className="text-slate-200">{selectedCliente.nome}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditForm(selectedCliente)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Editar
                </button>
                <button
                  onClick={() => setSelectedCliente(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profile info */}
            {(() => {
              const seller = dataService.getPerfilById(selectedCliente.responsavel_id);
              const clientOps = dataService.getOportunidades().filter((o) => o.cliente_id === selectedCliente.id);
              const clientAtivs = dataService.getAtividades().filter((a) => a.cliente_id === selectedCliente.id);

              return (
                <div className="mt-5 space-y-6">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Telefone</span>
                      <span className="text-slate-200 font-mono tabular-nums font-medium">
                        {selectedCliente.telefone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">E-mail</span>
                      <span className="text-slate-200 font-medium truncate block">
                        {selectedCliente.email || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Origem</span>
                      <span className="text-slate-200">{selectedCliente.origem}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Responsável</span>
                      <span className="text-slate-200 font-medium">{seller?.nome || '—'}</span>
                    </div>
                  </div>

                  {selectedCliente.observacoes && (
                    <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Observações do Cliente
                      </span>
                      <p className="text-xs text-slate-300 mt-1">{selectedCliente.observacoes}</p>
                    </div>
                  )}

                  {/* Linked Opportunities History */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      <span>Histórico de Oportunidades ({clientOps.length})</span>
                    </h3>

                    <div className="space-y-2">
                      {clientOps.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">
                          Nenhuma negociação registrada para este cliente.
                        </p>
                      ) : (
                        clientOps.map((op) => (
                          <div
                            key={op.id}
                            className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-white block">{op.titulo}</span>
                              <span className="text-[11px] text-slate-400">{op.produto_servico}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono tabular-nums font-bold text-white block">
                                {formatCurrency(op.valor)}
                              </span>
                              <span className="text-[10px] text-blue-400 font-medium">
                                {op.etapa}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Linked Activities History */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-emerald-400" />
                      <span>Histórico de Atividades ({clientAtivs.length})</span>
                    </h3>

                    <div className="space-y-2">
                      {clientAtivs.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">
                          Nenhuma atividade vinculada.
                        </p>
                      ) : (
                        clientAtivs.map((a) => (
                          <div
                            key={a.id}
                            className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-emerald-400">{a.tipo}</span>
                                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                                  {formatDate(a.data_hora)}
                                </span>
                              </div>
                              <p className="text-slate-300">{a.descricao}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
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

      {/* New / Edit Client Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formEmpresa}
                    onChange={(e) => setFormEmpresa(e.target.value)}
                    placeholder="Razão Social ou Nome Fantasia"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nome do Contato *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Nome completo do decisor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Origem do Cliente
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Observações
                </label>
                <textarea
                  rows={3}
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  placeholder="Informações adicionais, porte da empresa, histórico de contato..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
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
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
