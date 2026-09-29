export type UserRole = 'gestao' | 'vendedor';

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cargo: string;
  role: UserRole;
  meta_mensal: number;
  ativo: boolean;
  created_at: string;
  updated_at?: string;
}

export type OrigemLead =
  | 'Indicação'
  | 'Google/Site'
  | 'Redes Sociais'
  | 'Evento'
  | 'Outbound'
  | 'Outro';

export interface Cliente {
  id: string;
  nome: string;
  empresa: string;
  telefone: string;
  email: string;
  origem: OrigemLead;
  observacoes: string;
  responsavel_id: string;
  created_at: string;
  updated_at?: string;
}

export type EtapaFunil =
  | 'Lead'
  | 'Contato'
  | 'Qualificação'
  | 'Proposta'
  | 'Negociação'
  | 'Venda Ganha'
  | 'Venda Perdida';

export const ETAPAS_FUNIL: EtapaFunil[] = [
  'Lead',
  'Contato',
  'Qualificação',
  'Proposta',
  'Negociação',
  'Venda Ganha',
  'Venda Perdida',
];

export interface Oportunidade {
  id: string;
  titulo: string;
  cliente_id: string;
  produto_servico: string;
  valor: number;
  responsavel_id: string;
  origem: OrigemLead;
  etapa: EtapaFunil;
  data_prevista_fechamento?: string;
  ultimo_contato?: string;
  proxima_acao?: string;
  data_proxima_acao?: string;
  motivo_perda?: string;
  motivo_perda_detalhes?: string;
  data_fechamento?: string;
  created_at: string;
  updated_at?: string;
}

export type TipoAtividade =
  | 'Ligação'
  | 'Reunião'
  | 'E-mail'
  | 'WhatsApp'
  | 'Follow-up';

export type StatusAtividade = 'pendente' | 'concluida' | 'atrasada';

export interface Atividade {
  id: string;
  tipo: TipoAtividade;
  descricao: string;
  oportunidade_id?: string;
  cliente_id?: string;
  responsavel_id: string;
  data_hora: string;
  status: StatusAtividade;
  proxima_acao?: string;
  concluida_em?: string;
  created_at: string;
}

export interface IndicadoresConsolidados {
  total_leads: number;
  oportunidades_abertas: number;
  vendas_ganhas: number;
  vendas_perdidas: number;
  valor_negociacao: number;
  valor_vendido: number;
  ticket_medio: number;
  taxa_conversao: number;
  distribuicao_etapas: { etapa: EtapaFunil; quantidade: number; valor_total: number }[];
  motivos_perda: { motivo: string; total: number }[];
  distribuicao_origem: { origem: OrigemLead; quantidade: number; valor_total: number }[];
}

export type PageTab =
  | 'funil'
  | 'clientes'
  | 'vendedores'
  | 'atividades'
  | 'dashboard';
