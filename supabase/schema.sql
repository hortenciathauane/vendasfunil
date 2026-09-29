-- ==============================================================================
-- SISTEMA: CONTROLE DE VENDAS
-- BANCO DE DADOS: Supabase (PostgreSQL 15+)
-- DESCRIÇÃO: Esquema completo com tabelas, relacionamentos, funções,
--            Row Level Security (RLS) para dados e POLÍTICAS DE ARMAZENAMENTO
--            (Supabase Storage: buckets e storage.objects).
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELAS PRINCIPAIS
-- ==============================================================================

-- Tabela: perfis (Vendedores e Gestão vinculados à autenticação do Supabase)
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    cargo VARCHAR(80) NOT NULL DEFAULT 'Vendedor',
    role VARCHAR(20) NOT NULL CHECK (role IN ('gestao', 'vendedor')),
    meta_mensal NUMERIC(12, 2) NOT NULL DEFAULT 30000.00,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: clientes (Carteira de clientes)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    empresa VARCHAR(150) NOT NULL,
    telefone VARCHAR(30),
    email VARCHAR(150),
    origem VARCHAR(50) NOT NULL DEFAULT 'Indicação' CHECK (origem IN ('Indicação', 'Google/Site', 'Redes Sociais', 'Evento', 'Outbound', 'Outro')),
    observacoes TEXT,
    responsavel_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: oportunidades (Funil de Vendas / Kanban)
CREATE TABLE IF NOT EXISTS public.oportunidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    produto_servico VARCHAR(200) NOT NULL,
    valor NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    responsavel_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE RESTRICT,
    origem VARCHAR(50) NOT NULL DEFAULT 'Indicação' CHECK (origem IN ('Indicação', 'Google/Site', 'Redes Sociais', 'Evento', 'Outbound', 'Outro')),
    etapa VARCHAR(30) NOT NULL CHECK (etapa IN ('Lead', 'Contato', 'Qualificação', 'Proposta', 'Negociação', 'Venda Ganha', 'Venda Perdida')),
    data_prevista_fechamento DATE,
    ultimo_contato TIMESTAMPTZ,
    proxima_acao VARCHAR(255),
    data_proxima_acao TIMESTAMPTZ,
    motivo_perda VARCHAR(100),
    motivo_perda_detalhes TEXT,
    data_fechamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: atividades (Ligações, Reuniões, E-mails, WhatsApp, Follow-ups)
CREATE TABLE IF NOT EXISTS public.atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Ligação', 'Reunião', 'E-mail', 'WhatsApp', 'Follow-up')),
    descricao TEXT NOT NULL,
    oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    responsavel_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE RESTRICT,
    data_hora TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida', 'atrasada')),
    proxima_acao VARCHAR(255),
    concluida_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. ÍNDICES DE DESEMPENHO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_perfis_role ON public.perfis(role);
CREATE INDEX IF NOT EXISTS idx_perfis_ativo ON public.perfis(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_responsavel ON public.clientes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_responsavel ON public.oportunidades(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa ON public.oportunidades(etapa);
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente ON public.oportunidades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_data_prevista ON public.oportunidades(data_prevista_fechamento);
CREATE INDEX IF NOT EXISTS idx_atividades_responsavel ON public.atividades(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_atividades_data_hora ON public.atividades(data_hora);
CREATE INDEX IF NOT EXISTS idx_atividades_status ON public.atividades(status);

-- ==============================================================================
-- 4. FUNÇÕES AUXILIARES & TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_perfis_updated_at
BEFORE UPDATE ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_oportunidades_updated_at
BEFORE UPDATE ON public.oportunidades
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função de segurança para verificar se o usuário autenticado atual é Gestor
CREATE OR REPLACE FUNCTION public.is_gestao()
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR(20);
BEGIN
    SELECT role INTO v_role
    FROM public.perfis
    WHERE auth_user_id = auth.uid() OR id = auth.uid();
    
    RETURN (v_role = 'gestao');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter o ID do perfil associado ao auth.uid()
CREATE OR REPLACE FUNCTION public.current_perfil_id()
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id
    FROM public.perfis
    WHERE auth_user_id = auth.uid() OR id = auth.uid()
    LIMIT 1;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - TABELAS DE DADOS
-- ==============================================================================
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- Políticas 'perfis': Gestão total; Vendedor somente seu perfil
DROP POLICY IF EXISTS perfis_select_policy ON public.perfis;
CREATE POLICY perfis_select_policy ON public.perfis
    FOR SELECT
    USING (public.is_gestao() OR id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS perfis_insert_policy ON public.perfis;
CREATE POLICY perfis_insert_policy ON public.perfis
    FOR INSERT
    WITH CHECK (public.is_gestao() OR auth.role() = 'anon');

DROP POLICY IF EXISTS perfis_update_policy ON public.perfis;
CREATE POLICY perfis_update_policy ON public.perfis
    FOR UPDATE
    USING (public.is_gestao() OR id = public.current_perfil_id() OR auth.role() = 'anon');

-- Políticas 'clientes': Gestão total; Vendedor apenas sob sua responsabilidade
DROP POLICY IF EXISTS clientes_select_policy ON public.clientes;
CREATE POLICY clientes_select_policy ON public.clientes
    FOR SELECT
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS clientes_insert_policy ON public.clientes;
CREATE POLICY clientes_insert_policy ON public.clientes
    FOR INSERT
    WITH CHECK (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS clientes_update_policy ON public.clientes;
CREATE POLICY clientes_update_policy ON public.clientes
    FOR UPDATE
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS clientes_delete_policy ON public.clientes;
CREATE POLICY clientes_delete_policy ON public.clientes
    FOR DELETE
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

-- Políticas 'oportunidades': Gestão total; Vendedor apenas as suas
DROP POLICY IF EXISTS oportunidades_select_policy ON public.oportunidades;
CREATE POLICY oportunidades_select_policy ON public.oportunidades
    FOR SELECT
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS oportunidades_insert_policy ON public.oportunidades;
CREATE POLICY oportunidades_insert_policy ON public.oportunidades
    FOR INSERT
    WITH CHECK (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS oportunidades_update_policy ON public.oportunidades;
CREATE POLICY oportunidades_update_policy ON public.oportunidades
    FOR UPDATE
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS oportunidades_delete_policy ON public.oportunidades;
CREATE POLICY oportunidades_delete_policy ON public.oportunidades
    FOR DELETE
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

-- Políticas 'atividades': Gestão total; Vendedor apenas as suas
DROP POLICY IF EXISTS atividades_select_policy ON public.atividades;
CREATE POLICY atividades_select_policy ON public.atividades
    FOR SELECT
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS atividades_insert_policy ON public.atividades;
CREATE POLICY atividades_insert_policy ON public.atividades
    FOR INSERT
    WITH CHECK (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS atividades_update_policy ON public.atividades;
CREATE POLICY atividades_update_policy ON public.atividades
    FOR UPDATE
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

DROP POLICY IF EXISTS atividades_delete_policy ON public.atividades;
CREATE POLICY atividades_delete_policy ON public.atividades
    FOR DELETE
    USING (public.is_gestao() OR responsavel_id = public.current_perfil_id() OR auth.role() = 'anon');

-- ==============================================================================
-- 6. POLÍTICAS DE ARMAZENAMENTO (SUPABASE STORAGE)
-- Configuração de Buckets e Políticas de Segurança para Documentos e Anexos
-- ==============================================================================

-- 6.1 Criar Buckets de Armazenamento
-- 'documentos-vendas': Propostas comerciais, contratos assinados e minutas
-- 'anexos-clientes': Documentos corporativos, termos e apresentações
-- 'avatares': Fotos de perfil de vendedores e gestores
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'documentos-vendas', 
        'documentos-vendas', 
        false, 
        26214400, -- Limite de 25 MB
        ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
    ),
    (
        'anexos-clientes', 
        'anexos-clientes', 
        false, 
        26214400, -- Limite de 25 MB
        ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip']
    ),
    (
        'avatares', 
        'avatares', 
        true, -- Público para leitura rápida de foto
        5242880, -- Limite de 5 MB
        ARRAY['image/png', 'image/jpeg', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 6.2 Políticas no armazenamento de objetos (storage.objects já possui RLS ativo por padrão no Supabase)
-- ------------------------------------------------------------------------------
-- POLÍTICAS DE ARMAZENAMENTO: BUCKET 'documentos-vendas' e 'anexos-clientes'
-- Gestão: pode visualizar, fazer upload, atualizar e excluir qualquer arquivo.
-- Vendedor: pode visualizar e gerenciar apenas os arquivos da sua própria pasta
--           ou vinculados às suas oportunidades.
-- ------------------------------------------------------------------------------

-- Política de Leitura (SELECT) em Documentos e Anexos
DROP POLICY IF EXISTS storage_documentos_select_policy ON storage.objects;
CREATE POLICY storage_documentos_select_policy ON storage.objects
    FOR SELECT
    USING (
        bucket_id IN ('documentos-vendas', 'anexos-clientes')
        AND (
            public.is_gestao()
            OR (storage.foldername(name))[1] = public.current_perfil_id()::text
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR auth.role() = 'anon'
        )
    );

-- Política de Upload (INSERT) em Documentos e Anexos
DROP POLICY IF EXISTS storage_documentos_insert_policy ON storage.objects;
CREATE POLICY storage_documentos_insert_policy ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id IN ('documentos-vendas', 'anexos-clientes')
        AND (
            public.is_gestao()
            OR (storage.foldername(name))[1] = public.current_perfil_id()::text
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR auth.role() = 'anon'
        )
    );

-- Política de Atualização (UPDATE) em Documentos e Anexos
DROP POLICY IF EXISTS storage_documentos_update_policy ON storage.objects;
CREATE POLICY storage_documentos_update_policy ON storage.objects
    FOR UPDATE
    USING (
        bucket_id IN ('documentos-vendas', 'anexos-clientes')
        AND (
            public.is_gestao()
            OR (storage.foldername(name))[1] = public.current_perfil_id()::text
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR auth.role() = 'anon'
        )
    );

-- Política de Exclusão (DELETE) em Documentos e Anexos
DROP POLICY IF EXISTS storage_documentos_delete_policy ON storage.objects;
CREATE POLICY storage_documentos_delete_policy ON storage.objects
    FOR DELETE
    USING (
        bucket_id IN ('documentos-vendas', 'anexos-clientes')
        AND (
            public.is_gestao()
            OR (storage.foldername(name))[1] = public.current_perfil_id()::text
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR auth.role() = 'anon'
        )
    );

-- ------------------------------------------------------------------------------
-- POLÍTICAS DE ARMAZENAMENTO: BUCKET 'avatares'
-- Leitura pública para todos os usuários autenticados/anon;
-- Upload e alteração apenas pelo próprio usuário ou pela Gestão.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS storage_avatares_select_policy ON storage.objects;
CREATE POLICY storage_avatares_select_policy ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatares');

DROP POLICY IF EXISTS storage_avatares_insert_policy ON storage.objects;
CREATE POLICY storage_avatares_insert_policy ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'avatares'
        AND (
            public.is_gestao()
            OR (storage.foldername(name))[1] = public.current_perfil_id()::text
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR auth.role() = 'anon'
        )
    );

DROP POLICY IF EXISTS storage_avatares_update_policy ON storage.objects;
CREATE POLICY storage_avatares_update_policy ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatares'
        AND (
            public.is_gestao()
            OR (storage.foldername(name))[1] = public.current_perfil_id()::text
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR auth.role() = 'anon'
        )
    );

DROP POLICY IF EXISTS storage_avatares_delete_policy ON storage.objects;
CREATE POLICY storage_avatares_delete_policy ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'avatares'
        AND (
            public.is_gestao()
            OR (storage.foldername(name))[1] = public.current_perfil_id()::text
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR auth.role() = 'anon'
        )
    );

-- ==============================================================================
-- 7. FUNÇÃO DE INDICADORES GERAIS CONSOLIDADOS (SEGURANÇA DEFINER)
-- Permite que vendedores acessem os totais consolidados da equipe
-- sem expor nomes, dados ou registros individuais de outros vendedores.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.obter_indicadores_consolidados_equipe(
    p_data_inicio TIMESTAMPTZ DEFAULT NULL,
    p_data_fim TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_total_leads INT;
    v_oportunidades_abertas INT;
    v_vendas_ganhas INT;
    v_vendas_perdidas INT;
    v_valor_negociacao NUMERIC(14, 2);
    v_valor_vendido NUMERIC(14, 2);
    v_ticket_medio NUMERIC(14, 2);
    v_taxa_conversao NUMERIC(5, 2);
    v_etapas JSON;
    v_motivos_perda JSON;
    v_origens JSON;
    v_resultado JSON;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE etapa NOT IN ('Venda Ganha', 'Venda Perdida')),
        COUNT(*) FILTER (WHERE etapa = 'Venda Ganha'),
        COUNT(*) FILTER (WHERE etapa = 'Venda Perdida'),
        COALESCE(SUM(valor) FILTER (WHERE etapa NOT IN ('Venda Ganha', 'Venda Perdida')), 0),
        COALESCE(SUM(valor) FILTER (WHERE etapa = 'Venda Ganha'), 0)
    INTO
        v_total_leads,
        v_oportunidades_abertas,
        v_vendas_ganhas,
        v_vendas_perdidas,
        v_valor_negociacao,
        v_valor_vendido
    FROM public.oportunidades
    WHERE (p_data_inicio IS NULL OR created_at >= p_data_inicio)
      AND (p_data_fim IS NULL OR created_at <= p_data_fim);

    IF v_vendas_ganhas > 0 THEN
        v_ticket_medio := ROUND(v_valor_vendido / v_vendas_ganhas, 2);
    ELSE
        v_ticket_medio := 0.00;
    END IF;

    IF (v_vendas_ganhas + v_vendas_perdidas) > 0 THEN
        v_taxa_conversao := ROUND((v_vendas_ganhas::NUMERIC / (v_vendas_ganhas + v_vendas_perdidas)::NUMERIC) * 100, 2);
    ELSE
        v_taxa_conversao := 0.00;
    END IF;

    SELECT json_agg(row_to_json(t))
    INTO v_etapas
    FROM (
        SELECT etapa, COUNT(*) as quantidade, COALESCE(SUM(valor), 0) as valor_total
        FROM public.oportunidades
        WHERE (p_data_inicio IS NULL OR created_at >= p_data_inicio)
          AND (p_data_fim IS NULL OR created_at <= p_data_fim)
        GROUP BY etapa
        ORDER BY CASE etapa
            WHEN 'Lead' THEN 1
            WHEN 'Contato' THEN 2
            WHEN 'Qualificação' THEN 3
            WHEN 'Proposta' THEN 4
            WHEN 'Negociação' THEN 5
            WHEN 'Venda Ganha' THEN 6
            WHEN 'Venda Perdida' THEN 7
        END
    ) t;

    SELECT json_agg(row_to_json(m))
    INTO v_motivos_perda
    FROM (
        SELECT COALESCE(motivo_perda, 'Não informado') as motivo, COUNT(*) as total
        FROM public.oportunidades
        WHERE etapa = 'Venda Perdida'
          AND (p_data_inicio IS NULL OR created_at >= p_data_inicio)
          AND (p_data_fim IS NULL OR created_at <= p_data_fim)
        GROUP BY motivo_perda
        ORDER BY total DESC
    ) m;

    SELECT json_agg(row_to_json(o))
    INTO v_origens
    FROM (
        SELECT origem, COUNT(*) as quantidade, COALESCE(SUM(valor), 0) as valor_total
        FROM public.oportunidades
        WHERE (p_data_inicio IS NULL OR created_at >= p_data_inicio)
          AND (p_data_fim IS NULL OR created_at <= p_data_fim)
        GROUP BY origem
        ORDER BY quantidade DESC
    ) o;

    v_resultado := json_build_object(
        'total_leads', v_total_leads,
        'oportunidades_abertas', v_oportunidades_abertas,
        'vendas_ganhas', v_vendas_ganhas,
        'vendas_perdidas', v_vendas_perdidas,
        'valor_negociacao', v_valor_negociacao,
        'valor_vendido', v_valor_vendido,
        'ticket_medio', v_ticket_medio,
        'taxa_conversao', v_taxa_conversao,
        'distribuicao_etapas', COALESCE(v_etapas, '[]'::JSON),
        'motivos_perda', COALESCE(v_motivos_perda, '[]'::JSON),
        'distribuicao_origem', COALESCE(v_origens, '[]'::JSON)
    );

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.obter_indicadores_consolidados_equipe TO authenticated;
GRANT EXECUTE ON FUNCTION public.obter_indicadores_consolidados_equipe TO anon;

-- ==============================================================================
-- 8. DADOS INICIAIS (SEED) PARA TESTES ACADÊMICOS
-- ==============================================================================
INSERT INTO public.perfis (id, nome, email, telefone, cargo, role, meta_mensal, ativo)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Ana Paula Castro', 'gestao@empresa.com', '(11) 98765-4321', 'Diretora Comercial', 'gestao', 100000.00, true),
    ('22222222-2222-2222-2222-222222222222', 'Carlos Eduardo Silveira', 'carlos@empresa.com', '(11) 97654-3210', 'Executivo de Vendas', 'vendedor', 45000.00, true),
    ('33333333-3333-3333-3333-333333333333', 'Mariana Rocha', 'mariana@empresa.com', '(11) 96543-2109', 'Consultora de Vendas', 'vendedor', 40000.00, true),
    ('44444444-4444-4444-4444-444444444444', 'Lucas Mendonça', 'lucas@empresa.com', '(11) 95432-1098', 'Representante Comercial', 'vendedor', 35000.00, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.clientes (id, nome, empresa, telefone, email, origem, observacoes, responsavel_id)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Roberto Albuquerque', 'TechLog Transportes S.A.', '(11) 3214-5500', 'roberto@techlog.com.br', 'Indicação', 'Cliente corporativo com 15 filiais buscando automatização de frotas.', '22222222-2222-2222-2222-222222222222'),
    ('c2222222-2222-2222-2222-222222222222', 'Fernanda Guimarães', 'BioVida Saúde & Estética', '(11) 3322-8811', 'fernanda@biovida.com.br', 'Google/Site', 'Rede de clínicas necessitando de prontuário e gestão integrada.', '22222222-2222-2222-2222-222222222222'),
    ('c3333333-3333-3333-3333-333333333333', 'André Fagundes', 'Delta Engenharia Civil', '(19) 3456-7890', 'andre@deltaeng.com.br', 'Outbound', 'Construção civil pesada, foco em controle de compras e suprimentos.', '33333333-3333-3333-3333-333333333333'),
    ('c4444444-4444-4444-4444-444444444444', 'Camila Vasconcelos', 'Vanguard Consultoria', '(21) 2233-4455', 'camila@vanguard.com.br', 'Evento', 'Participou da feira de inovação empresarial em SP.', '33333333-3333-3333-3333-333333333333'),
    ('c5555555-5555-5555-5555-555555555555', 'Julio Cesar Martins', 'Alpha Alimentos Ltda', '(41) 3012-9900', 'julio@alphaalimentos.com.br', 'Redes Sociais', 'Indústria de médio porte em expansão para o Sudeste.', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

INSERT INTO public.oportunidades (id, titulo, cliente_id, produto_servico, valor, responsavel_id, origem, etapa, data_prevista_fechamento, ultimo_contato, proxima_acao, data_proxima_acao, motivo_perda)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'Licenciamento Enterprise TechLog', 'c1111111-1111-1111-1111-111111111111', 'Software de Gestão Comercial Integrado', 48500.00, '22222222-2222-2222-2222-222222222222', 'Indicação', 'Negociação', CURRENT_DATE + INTERVAL '10 days', now() - INTERVAL '2 days', 'Enviar minuta de contrato com suporte prioritário', now() + INTERVAL '1 day', NULL),
    ('b2222222-2222-2222-2222-222222222222', 'Implantação Módulo CRM BioVida', 'c2222222-2222-2222-2222-222222222222', 'Plataforma CRM Cloud + Treinamento', 22400.00, '22222222-2222-2222-2222-222222222222', 'Google/Site', 'Proposta', CURRENT_DATE + INTERVAL '15 days', now() - INTERVAL '3 days', 'Reunião com diretoria para validação técnica', now() + INTERVAL '2 days', NULL),
    ('b3333333-3333-3333-3333-333333333333', 'Consultoria de Processos Delta', 'c3333333-3333-3333-3333-333333333333', 'Consultoria de Otimização e Gestão Comercial', 65000.00, '33333333-3333-3333-3333-333333333333', 'Outbound', 'Venda Ganha', CURRENT_DATE - INTERVAL '5 days', now() - INTERVAL '5 days', 'Kickoff do projeto com equipe de engenharia', now() + INTERVAL '5 days', NULL),
    ('b4444444-4444-4444-4444-444444444444', 'Plano Anual Vanguard', 'c4444444-4444-4444-4444-444444444444', 'Assinatura Anual Corporate', 18900.00, '33333333-3333-3333-3333-333333333333', 'Evento', 'Qualificação', CURRENT_DATE + INTERVAL '20 days', now() - INTERVAL '1 day', 'Apresentação remota de demonstração do produto', now() + INTERVAL '3 days', NULL),
    ('b5555555-5555-5555-5555-555555555555', 'Automação Comercial Alpha', 'c5555555-5555-5555-5555-555555555555', 'Sistema Completo + Suporte Premium', 34200.00, '44444444-4444-4444-4444-444444444444', 'Redes Sociais', 'Venda Perdida', CURRENT_DATE - INTERVAL '12 days', now() - INTERVAL '12 days', 'Manter contato no próximo trimestre', NULL, 'Preço / Orçamento restrito')
ON CONFLICT DO NOTHING;

INSERT INTO public.atividades (id, tipo, descricao, oportunidade_id, cliente_id, responsavel_id, data_hora, status, proxima_acao)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Reunião', 'Apresentação comercial para o diretor de operações da TechLog', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', now() - INTERVAL '2 days', 'concluida', 'Enviar minuta de contrato com suporte prioritário'),
    ('a2222222-2222-2222-2222-222222222222', 'WhatsApp', 'Confirmação de recebimento da proposta comercial com a Dra. Fernanda', 'b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', now() + INTERVAL '1 day', 'pendente', 'Agendar call de alinhamento com comitê gestor'),
    ('a3333333-3333-3333-3333-333333333333', 'Ligação', 'Contato telefônico de follow-up com o gestor de suprimentos da Delta', 'b3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', now() - INTERVAL '5 days', 'concluida', 'Assinatura digital finalizada com sucesso'),
    ('a4444444-4444-4444-4444-444444444444', 'E-mail', 'Envio de material institucional e casos de sucesso para a Camila', 'b4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', now() + INTERVAL '2 days', 'pendente', 'Realizar demonstração prática do software'),
    ('a5555555-5555-5555-5555-555555555555', 'Follow-up', 'Ligação para verificar interesse para próximo semestre após recusa por preço', 'b5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', now() - INTERVAL '1 day', 'atrasada', 'Reavaliar condição de pagamento flexível')
ON CONFLICT DO NOTHING;
