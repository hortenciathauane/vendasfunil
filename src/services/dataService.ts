import {
  Perfil,
  Cliente,
  Oportunidade,
  Atividade,
  EtapaFunil,
  IndicadoresConsolidados,
  ETAPAS_FUNIL,
} from '../types';
import {
  INITIAL_PERFIS,
  INITIAL_CLIENTES,
  INITIAL_OPORTUNIDADES,
  INITIAL_ATIVIDADES,
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  CURRENT_USER: 'cv_current_user',
  PERFIS: 'cv_perfis',
  CLIENTES: 'cv_clientes',
  OPORTUNIDADES: 'cv_oportunidades',
  ATIVIDADES: 'cv_atividades',
};

class DataService {
  private perfis: Perfil[] = [];
  private clientes: Cliente[] = [];
  private oportunidades: Oportunidade[] = [];
  private atividades: Atividade[] = [];
  private currentUser: Perfil | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 1. Load perfis
    const storedPerfis = localStorage.getItem(STORAGE_KEYS.PERFIS);
    if (storedPerfis) {
      try {
        this.perfis = JSON.parse(storedPerfis);
      } catch {
        this.perfis = [...INITIAL_PERFIS];
      }
    } else {
      this.perfis = [...INITIAL_PERFIS];
      this.savePerfis();
    }

    // 2. Load clientes
    const storedClientes = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    if (storedClientes) {
      try {
        this.clientes = JSON.parse(storedClientes);
      } catch {
        this.clientes = [...INITIAL_CLIENTES];
      }
    } else {
      this.clientes = [...INITIAL_CLIENTES];
      this.saveClientes();
    }

    // 3. Load oportunidades
    const storedOportunidades = localStorage.getItem(STORAGE_KEYS.OPORTUNIDADES);
    if (storedOportunidades) {
      try {
        this.oportunidades = JSON.parse(storedOportunidades);
      } catch {
        this.oportunidades = [...INITIAL_OPORTUNIDADES];
      }
    } else {
      this.oportunidades = [...INITIAL_OPORTUNIDADES];
      this.saveOportunidades();
    }

    // 4. Load atividades
    const storedAtividades = localStorage.getItem(STORAGE_KEYS.ATIVIDADES);
    if (storedAtividades) {
      try {
        this.atividades = JSON.parse(storedAtividades);
      } catch {
        this.atividades = [...INITIAL_ATIVIDADES];
      }
    } else {
      this.atividades = [...INITIAL_ATIVIDADES];
      this.saveAtividades();
    }

    // 5. Load current user session
    const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const match = this.perfis.find((p) => p.id === parsed.id && p.ativo);
        this.currentUser = match || this.perfis[0];
      } catch {
        this.currentUser = this.perfis[0];
      }
    } else {
      // Default to gestao
      this.currentUser = this.perfis[0];
      this.saveCurrentUser();
    }

    this.syncFromSupabaseIfPossible();
  }

  private async persistToSupabase(table: string, data: any, opType: 'upsert' | 'delete' = 'upsert') {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      if (opType === 'upsert') {
        await supabase.from(table).upsert(data);
      } else if (opType === 'delete') {
        await supabase.from(table).delete().eq('id', data.id);
      }
    } catch {
      // Quiet failover: do not expose technical errors in the interface
    }
  }

  private async syncFromSupabaseIfPossible() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: perfisData, error: perfisError } = await supabase.from('perfis').select('*');
      if (!perfisError) {
        if (perfisData && perfisData.length > 0) {
          this.perfis = perfisData;
          this.savePerfis();
        } else if (perfisData && perfisData.length === 0) {
          // Table exists but is empty: seed initial records
          await supabase.from('perfis').insert(this.perfis);
        }
      }

      const { data: clientesData, error: clientesError } = await supabase.from('clientes').select('*');
      if (!clientesError) {
        if (clientesData && clientesData.length > 0) {
          this.clientes = clientesData;
          this.saveClientes();
        } else if (clientesData && clientesData.length === 0) {
          await supabase.from('clientes').insert(this.clientes);
        }
      }

      const { data: opData, error: opError } = await supabase.from('oportunidades').select('*');
      if (!opError) {
        if (opData && opData.length > 0) {
          this.oportunidades = opData;
          this.saveOportunidades();
        } else if (opData && opData.length === 0) {
          await supabase.from('oportunidades').insert(this.oportunidades);
        }
      }

      const { data: ativData, error: ativError } = await supabase.from('atividades').select('*');
      if (!ativError) {
        if (ativData && ativData.length > 0) {
          this.atividades = ativData;
          this.saveAtividades();
        } else if (ativData && ativData.length === 0) {
          await supabase.from('atividades').insert(this.atividades);
        }
      }
      this.notify();
    } catch {
      // Quiet failover to local data without technical alerts
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Storage saves
  private savePerfis() {
    localStorage.setItem(STORAGE_KEYS.PERFIS, JSON.stringify(this.perfis));
  }
  private saveClientes() {
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(this.clientes));
  }
  private saveOportunidades() {
    localStorage.setItem(STORAGE_KEYS.OPORTUNIDADES, JSON.stringify(this.oportunidades));
  }
  private saveAtividades() {
    localStorage.setItem(STORAGE_KEYS.ATIVIDADES, JSON.stringify(this.atividades));
  }
  private saveCurrentUser() {
    if (this.currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // --- AUTH & CURRENT USER ---
  public getCurrentUser(): Perfil | null {
    return this.currentUser;
  }

  public login(emailOrUsername: string, _password?: string): { success: boolean; message?: string } {
    const clean = emailOrUsername.trim().toLowerCase();
    
    // Check match by email or prefix
    const found = this.perfis.find(
      (p) => p.email.toLowerCase() === clean || p.email.toLowerCase().startsWith(clean)
    );

    if (!found) {
      return { success: false, message: 'Usuário não localizado ou credenciais inválidas.' };
    }

    if (!found.ativo) {
      return { success: false, message: 'Acesso desativado pela gestão.' };
    }

    this.currentUser = found;
    this.saveCurrentUser();
    this.notify();
    return { success: true };
  }

  public switchUser(perfilId: string): boolean {
    const found = this.perfis.find((p) => p.id === perfilId && p.ativo);
    if (found) {
      this.currentUser = found;
      this.saveCurrentUser();
      this.notify();
      return true;
    }
    return false;
  }

  public logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notify();
  }

  // --- PERFIS / VENDEDORES ---
  public getPerfis(): Perfil[] {
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'gestao') {
      return [...this.perfis];
    }
    // Vendedor only sees himself
    return this.perfis.filter((p) => p.id === this.currentUser?.id);
  }

  public getAllActiveSellers(): Perfil[] {
    return this.perfis.filter((p) => p.ativo && p.role === 'vendedor');
  }

  public getPerfilById(id: string): Perfil | undefined {
    return this.perfis.find((p) => p.id === id);
  }

  public savePerfil(perfilData: Partial<Perfil> & { nome: string; email: string; role: 'gestao' | 'vendedor' }): Perfil {
    if (this.currentUser?.role !== 'gestao') {
      throw new Error('Acesso restrito à gestão.');
    }

    if (perfilData.id) {
      const idx = this.perfis.findIndex((p) => p.id === perfilData.id);
      if (idx >= 0) {
        this.perfis[idx] = {
          ...this.perfis[idx],
          ...perfilData,
          updated_at: new Date().toISOString(),
        };
        this.savePerfis();
        this.persistToSupabase('perfis', this.perfis[idx]);
        if (this.currentUser.id === perfilData.id) {
          this.currentUser = this.perfis[idx];
          this.saveCurrentUser();
        }
        this.notify();
        return this.perfis[idx];
      }
    }

    const newPerfil: Perfil = {
      id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
      nome: perfilData.nome,
      email: perfilData.email,
      telefone: perfilData.telefone || '',
      cargo: perfilData.cargo || (perfilData.role === 'gestao' ? 'Gestor Comercial' : 'Executivo de Vendas'),
      role: perfilData.role,
      meta_mensal: Number(perfilData.meta_mensal) || 40000,
      ativo: perfilData.ativo ?? true,
      created_at: new Date().toISOString(),
    };

    this.perfis.push(newPerfil);
    this.savePerfis();
    this.persistToSupabase('perfis', newPerfil);
    this.notify();
    return newPerfil;
  }

  public togglePerfilAtivo(id: string): void {
    if (this.currentUser?.role !== 'gestao') return;
    const target = this.perfis.find((p) => p.id === id);
    if (!target) return;
    // Don't allow deactivating self if last gestor
    if (target.id === this.currentUser.id) return;

    target.ativo = !target.ativo;
    target.updated_at = new Date().toISOString();
    this.savePerfis();
    this.persistToSupabase('perfis', target);
    this.notify();
  }

  // --- CLIENTES ---
  public getClientes(): Cliente[] {
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'gestao') {
      return [...this.clientes];
    }
    return this.clientes.filter((c) => c.responsavel_id === this.currentUser?.id);
  }

  public getClienteById(id: string): Cliente | undefined {
    return this.clientes.find((c) => c.id === id);
  }

  public saveCliente(clienteData: Partial<Cliente> & { nome: string; empresa: string; origem: any }): Cliente {
    if (!this.currentUser) throw new Error('Não autenticado');

    const responsavelId =
      this.currentUser.role === 'gestao' && clienteData.responsavel_id
        ? clienteData.responsavel_id
        : this.currentUser.id;

    if (clienteData.id) {
      const idx = this.clientes.findIndex((c) => c.id === clienteData.id);
      if (idx >= 0) {
        // Check permission if seller
        if (this.currentUser.role === 'vendedor' && this.clientes[idx].responsavel_id !== this.currentUser.id) {
          throw new Error('Permissão negada');
        }
        this.clientes[idx] = {
          ...this.clientes[idx],
          ...clienteData,
          responsavel_id: responsavelId,
          updated_at: new Date().toISOString(),
        };
        this.saveClientes();
        this.persistToSupabase('clientes', this.clientes[idx]);
        this.notify();
        return this.clientes[idx];
      }
    }

    const newCliente: Cliente = {
      id: crypto.randomUUID ? crypto.randomUUID() : `cli-${Date.now()}`,
      nome: clienteData.nome,
      empresa: clienteData.empresa,
      telefone: clienteData.telefone || '',
      email: clienteData.email || '',
      origem: clienteData.origem || 'Indicação',
      observacoes: clienteData.observacoes || '',
      responsavel_id: responsavelId,
      created_at: new Date().toISOString(),
    };

    this.clientes.unshift(newCliente);
    this.saveClientes();
    this.persistToSupabase('clientes', newCliente);
    this.notify();
    return newCliente;
  }

  public deleteCliente(id: string): void {
    if (!this.currentUser) return;
    const client = this.clientes.find((c) => c.id === id);
    if (!client) return;

    if (this.currentUser.role === 'vendedor' && client.responsavel_id !== this.currentUser.id) {
      return;
    }

    this.clientes = this.clientes.filter((c) => c.id !== id);
    // Cascade delete or detach opportunities
    this.oportunidades = this.oportunidades.filter((o) => o.cliente_id !== id);
    this.atividades = this.atividades.filter((a) => a.cliente_id !== id);
    this.saveClientes();
    this.saveOportunidades();
    this.saveAtividades();
    this.persistToSupabase('clientes', { id }, 'delete');
    this.notify();
  }

  // --- OPORTUNIDADES (FUNIL DE VENDAS) ---
  public getOportunidades(): Oportunidade[] {
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'gestao') {
      return [...this.oportunidades];
    }
    return this.oportunidades.filter((o) => o.responsavel_id === this.currentUser?.id);
  }

  public getOportunidadeById(id: string): Oportunidade | undefined {
    return this.oportunidades.find((o) => o.id === id);
  }

  public saveOportunidade(
    opData: Partial<Oportunidade> & {
      titulo: string;
      cliente_id: string;
      produto_servico: string;
      valor: number;
      origem: any;
      etapa: EtapaFunil;
    }
  ): Oportunidade {
    if (!this.currentUser) throw new Error('Não autenticado');

    const responsavelId =
      this.currentUser.role === 'gestao' && opData.responsavel_id
        ? opData.responsavel_id
        : this.currentUser.id;

    if (opData.id) {
      const idx = this.oportunidades.findIndex((o) => o.id === opData.id);
      if (idx >= 0) {
        if (this.currentUser.role === 'vendedor' && this.oportunidades[idx].responsavel_id !== this.currentUser.id) {
          throw new Error('Permissão negada');
        }

        const isClosing = opData.etapa === 'Venda Ganha' || opData.etapa === 'Venda Perdida';
        const wasClosing = this.oportunidades[idx].etapa === 'Venda Ganha' || this.oportunidades[idx].etapa === 'Venda Perdida';

        this.oportunidades[idx] = {
          ...this.oportunidades[idx],
          ...opData,
          responsavel_id: responsavelId,
          data_fechamento: isClosing ? (wasClosing ? this.oportunidades[idx].data_fechamento : new Date().toISOString()) : undefined,
          updated_at: new Date().toISOString(),
        };
        this.saveOportunidades();
        this.persistToSupabase('oportunidades', this.oportunidades[idx]);
        this.notify();
        return this.oportunidades[idx];
      }
    }

    const isClosing = opData.etapa === 'Venda Ganha' || opData.etapa === 'Venda Perdida';
    const newOp: Oportunidade = {
      id: crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}`,
      titulo: opData.titulo,
      cliente_id: opData.cliente_id,
      produto_servico: opData.produto_servico,
      valor: Number(opData.valor) || 0,
      responsavel_id: responsavelId,
      origem: opData.origem || 'Indicação',
      etapa: opData.etapa || 'Lead',
      data_prevista_fechamento: opData.data_prevista_fechamento,
      ultimo_contato: opData.ultimo_contato || new Date().toISOString(),
      proxima_acao: opData.proxima_acao,
      data_proxima_acao: opData.data_proxima_acao,
      motivo_perda: opData.motivo_perda,
      motivo_perda_detalhes: opData.motivo_perda_detalhes,
      data_fechamento: isClosing ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
    };

    this.oportunidades.unshift(newOp);
    this.saveOportunidades();
    this.persistToSupabase('oportunidades', newOp);
    this.notify();
    return newOp;
  }

  public moveOportunidade(id: string, novaEtapa: EtapaFunil, motivoPerda?: string, motivoDetalhes?: string): void {
    if (!this.currentUser) return;
    const op = this.oportunidades.find((o) => o.id === id);
    if (!op) return;

    if (this.currentUser.role === 'vendedor' && op.responsavel_id !== this.currentUser.id) {
      return;
    }

    op.etapa = novaEtapa;
    op.ultimo_contato = new Date().toISOString();
    op.updated_at = new Date().toISOString();

    if (novaEtapa === 'Venda Ganha') {
      op.data_fechamento = new Date().toISOString();
      op.motivo_perda = undefined;
      op.motivo_perda_detalhes = undefined;
    } else if (novaEtapa === 'Venda Perdida') {
      op.data_fechamento = new Date().toISOString();
      op.motivo_perda = motivoPerda || 'Outro';
      op.motivo_perda_detalhes = motivoDetalhes || '';
    } else {
      op.data_fechamento = undefined;
      op.motivo_perda = undefined;
      op.motivo_perda_detalhes = undefined;
    }

    this.saveOportunidades();
    this.persistToSupabase('oportunidades', op);
    this.notify();
  }

  public deleteOportunidade(id: string): void {
    if (!this.currentUser) return;
    const op = this.oportunidades.find((o) => o.id === id);
    if (!op) return;

    if (this.currentUser.role === 'vendedor' && op.responsavel_id !== this.currentUser.id) {
      return;
    }

    this.oportunidades = this.oportunidades.filter((o) => o.id !== id);
    this.atividades = this.atividades.filter((a) => a.oportunidade_id !== id);
    this.saveOportunidades();
    this.saveAtividades();
    this.persistToSupabase('oportunidades', { id }, 'delete');
    this.notify();
  }

  // --- ATIVIDADES ---
  public getAtividades(): Atividade[] {
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'gestao') {
      return [...this.atividades];
    }
    return this.atividades.filter((a) => a.responsavel_id === this.currentUser?.id);
  }

  public saveAtividade(
    ativData: Partial<Atividade> & {
      tipo: any;
      descricao: string;
      data_hora: string;
    }
  ): Atividade {
    if (!this.currentUser) throw new Error('Não autenticado');

    const responsavelId =
      this.currentUser.role === 'gestao' && ativData.responsavel_id
        ? ativData.responsavel_id
        : this.currentUser.id;

    if (ativData.id) {
      const idx = this.atividades.findIndex((a) => a.id === ativData.id);
      if (idx >= 0) {
        if (this.currentUser.role === 'vendedor' && this.atividades[idx].responsavel_id !== this.currentUser.id) {
          throw new Error('Permissão negada');
        }
        this.atividades[idx] = {
          ...this.atividades[idx],
          ...ativData,
          responsavel_id: responsavelId,
        };
        this.saveAtividades();
        this.persistToSupabase('atividades', this.atividades[idx]);
        this.notify();
        return this.atividades[idx];
      }
    }

    const newAtiv: Atividade = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ativ-${Date.now()}`,
      tipo: ativData.tipo,
      descricao: ativData.descricao,
      oportunidade_id: ativData.oportunidade_id || undefined,
      cliente_id: ativData.cliente_id || undefined,
      responsavel_id: responsavelId,
      data_hora: ativData.data_hora,
      status: ativData.status || 'pendente',
      proxima_acao: ativData.proxima_acao || '',
      created_at: new Date().toISOString(),
    };

    // If linked to an opportunity, update its ultimo_contato and proxima_acao
    if (newAtiv.oportunidade_id) {
      const op = this.oportunidades.find((o) => o.id === newAtiv.oportunidade_id);
      if (op) {
        op.ultimo_contato = new Date().toISOString();
        if (newAtiv.proxima_acao) {
          op.proxima_acao = newAtiv.proxima_acao;
        }
        this.saveOportunidades();
        this.persistToSupabase('oportunidades', op);
      }
    }

    this.atividades.unshift(newAtiv);
    this.saveAtividades();
    this.persistToSupabase('atividades', newAtiv);
    this.notify();
    return newAtiv;
  }

  public toggleAtividadeStatus(id: string): void {
    if (!this.currentUser) return;
    const ativ = this.atividades.find((a) => a.id === id);
    if (!ativ) return;

    if (this.currentUser.role === 'vendedor' && ativ.responsavel_id !== this.currentUser.id) {
      return;
    }

    if (ativ.status === 'concluida') {
      ativ.status = 'pendente';
      ativ.concluida_em = undefined;
    } else {
      ativ.status = 'concluida';
      ativ.concluida_em = new Date().toISOString();
    }

    this.saveAtividades();
    this.persistToSupabase('atividades', ativ);
    this.notify();
  }

  public deleteAtividade(id: string): void {
    if (!this.currentUser) return;
    const ativ = this.atividades.find((a) => a.id === id);
    if (!ativ) return;

    if (this.currentUser.role === 'vendedor' && ativ.responsavel_id !== this.currentUser.id) {
      return;
    }

    this.atividades = this.atividades.filter((a) => a.id !== id);
    this.saveAtividades();
    this.persistToSupabase('atividades', { id }, 'delete');
    this.notify();
  }

  // --- DASHBOARD & INDICADORES ---
  public getIndicadores(filtros?: {
    periodoDias?: number;
    responsavelId?: string; // only Gestão can filter by seller
    etapa?: EtapaFunil;
    origem?: string;
  }): {
    userStats: IndicadoresConsolidados;
    teamStats: IndicadoresConsolidados;
    canViewTeamBreakdown: boolean;
  } {
    const isGestao = this.currentUser?.role === 'gestao';

    // 1. Calculate General Team Consolidated Metrics (all opportunities)
    let teamOps = [...this.oportunidades];
    if (filtros?.periodoDias) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filtros.periodoDias);
      teamOps = teamOps.filter((o) => new Date(o.created_at) >= cutoff);
    }
    if (filtros?.etapa) {
      teamOps = teamOps.filter((o) => o.etapa === filtros.etapa);
    }
    if (filtros?.origem) {
      teamOps = teamOps.filter((o) => o.origem === filtros.origem);
    }

    const teamStats = this.computeMetrics(teamOps);

    // 2. Calculate User / Active Filter Metrics
    let targetOps = [...this.oportunidades];

    if (!isGestao) {
      // Vendedor: strictly only his own ops
      targetOps = targetOps.filter((o) => o.responsavel_id === this.currentUser?.id);
    } else if (filtros?.responsavelId && filtros.responsavelId !== 'todos') {
      // Gestão filtered by specific seller
      targetOps = targetOps.filter((o) => o.responsavel_id === filtros.responsavelId);
    }

    if (filtros?.periodoDias) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filtros.periodoDias);
      targetOps = targetOps.filter((o) => new Date(o.created_at) >= cutoff);
    }
    if (filtros?.etapa) {
      targetOps = targetOps.filter((o) => o.etapa === filtros.etapa);
    }
    if (filtros?.origem) {
      targetOps = targetOps.filter((o) => o.origem === filtros.origem);
    }

    const userStats = this.computeMetrics(targetOps);

    return {
      userStats,
      teamStats,
      canViewTeamBreakdown: isGestao,
    };
  }

  private computeMetrics(ops: Oportunidade[]): IndicadoresConsolidados {
    const totalLeads = ops.length;
    const openOps = ops.filter((o) => o.etapa !== 'Venda Ganha' && o.etapa !== 'Venda Perdida');
    const wonOps = ops.filter((o) => o.etapa === 'Venda Ganha');
    const lostOps = ops.filter((o) => o.etapa === 'Venda Perdida');

    const valorNegociacao = openOps.reduce((sum, o) => sum + (o.valor || 0), 0);
    const valorVendido = wonOps.reduce((sum, o) => sum + (o.valor || 0), 0);

    const ticketMedio = wonOps.length > 0 ? valorVendido / wonOps.length : 0;
    const totalDecididos = wonOps.length + lostOps.length;
    const taxaConversao = totalDecididos > 0 ? (wonOps.length / totalDecididos) * 100 : 0;

    // Etapas breakdown
    const distribuicaoEtapas = ETAPAS_FUNIL.map((etapa) => {
      const matches = ops.filter((o) => o.etapa === etapa);
      return {
        etapa,
        quantidade: matches.length,
        valor_total: matches.reduce((sum, o) => sum + (o.valor || 0), 0),
      };
    });

    // Motivos de perda
    const motivoMap: Record<string, number> = {};
    lostOps.forEach((o) => {
      const key = o.motivo_perda || 'Não especificado';
      motivoMap[key] = (motivoMap[key] || 0) + 1;
    });
    const motivosPerda = Object.entries(motivoMap).map(([motivo, total]) => ({
      motivo,
      total,
    }));

    // Origens breakdown
    const origemMap: Record<string, { quantidade: number; valor_total: number }> = {};
    ops.forEach((o) => {
      if (!origemMap[o.origem]) {
        origemMap[o.origem] = { quantidade: 0, valor_total: 0 };
      }
      origemMap[o.origem].quantidade += 1;
      origemMap[o.origem].valor_total += o.valor || 0;
    });

    const distribuicaoOrigem = Object.entries(origemMap).map(([origem, val]) => ({
      origem: origem as any,
      quantidade: val.quantidade,
      valor_total: val.valor_total,
    }));

    return {
      total_leads: totalLeads,
      oportunidades_abertas: openOps.length,
      vendas_ganhas: wonOps.length,
      vendas_perdidas: lostOps.length,
      valor_negociacao: valorNegociacao,
      valor_vendido: valorVendido,
      ticket_medio: ticketMedio,
      taxa_conversao: taxaConversao,
      distribuicao_etapas: distribuicaoEtapas,
      motivos_perda: motivosPerda,
      distribuicao_origem: distribuicaoOrigem,
    };
  }

  // Seller individual performance for Gestão view
  public getDesempenhoVendedores() {
    if (this.currentUser?.role !== 'gestao') return [];
    const sellers = this.perfis.filter((p) => p.role === 'vendedor');

    return sellers.map((seller) => {
      const sellerOps = this.oportunidades.filter((o) => o.responsavel_id === seller.id);
      const wonOps = sellerOps.filter((o) => o.etapa === 'Venda Ganha');
      const openOps = sellerOps.filter((o) => o.etapa !== 'Venda Ganha' && o.etapa !== 'Venda Perdida');
      const valorVendido = wonOps.reduce((sum, o) => sum + (o.valor || 0), 0);
      const valorAberto = openOps.reduce((sum, o) => sum + (o.valor || 0), 0);
      const totalDecididos = wonOps.length + sellerOps.filter((o) => o.etapa === 'Venda Perdida').length;
      const taxa = totalDecididos > 0 ? (wonOps.length / totalDecididos) * 100 : 0;
      const ticket = wonOps.length > 0 ? valorVendido / wonOps.length : 0;
      const percentMeta = seller.meta_mensal > 0 ? (valorVendido / seller.meta_mensal) * 100 : 0;

      return {
        perfil: seller,
        totalOportunidades: sellerOps.length,
        vendasGanhas: wonOps.length,
        oportunidadesAbertas: openOps.length,
        valorVendido,
        valorAberto,
        ticketMedio: ticket,
        taxaConversao: taxa,
        percentMeta,
      };
    });
  }
}

export const dataService = new DataService();
