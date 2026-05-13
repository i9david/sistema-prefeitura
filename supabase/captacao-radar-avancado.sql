-- ============================================================================
-- SISTEMA AVANÇADO DE RADAR DE CAPTAÇÃO DE RECURSOS
-- Fase 1: Arquitetura de tabelas com scoring inteligente
-- ============================================================================

-- ============================================================================
-- 1. TABELA: captacao_radar_oportunidades
-- Centraliza TODAS as oportunidades descobertas (APIs, scraping, manual)
-- ============================================================================

CREATE TABLE IF NOT EXISTS captacao_radar_oportunidades (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id UUID NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,

  -- Dados básicos
  titulo VARCHAR(500) NOT NULL,
  descricao TEXT,
  url VARCHAR(2000) UNIQUE NOT NULL,
  
  -- Fonte
  fonte_id UUID REFERENCES captacao_radar_fontes(id) ON DELETE SET NULL,
  
  -- Classificação automática
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('edital', 'convenio', 'patrocinio', 'subvencao', 'chamada_publica', 'auxilio', 'emprestimo')),
  area VARCHAR(100) NOT NULL,
  
  -- Valores e prazos
  valor_estimado NUMERIC(15,2),
  data_abertura DATE,
  data_encerramento DATE,
  
  -- Elegibilidade
  elegivel_prefeitura BOOLEAN DEFAULT NULL, -- NULL = a validar, TRUE = sim, FALSE = não
  elegibilidade_motivo TEXT,
  
  -- Scoring
  score NUMERIC(5,2) DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_detalhe JSONB DEFAULT '{}'::jsonb, -- {area: 20, valor: 15, prazo: 20, aderencia: 15, novidade: 20}
  score_calculado_em TIMESTAMP DEFAULT NOW(),
  
  -- Status e auditoria
  status VARCHAR(50) NOT NULL DEFAULT 'nova' CHECK (status IN ('nova', 'analisada', 'descartada', 'arquivada', 'vinculada')),
  hash_unico VARCHAR(64) UNIQUE NOT NULL, -- SHA256 de titulo+url para deduplicação
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexação
  CONSTRAINT check_datas CHECK (data_encerramento IS NULL OR data_abertura IS NULL OR data_abertura <= data_encerramento)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_captacao_radar_oportunidades_municipio ON captacao_radar_oportunidades(municipio_id);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_oportunidades_status ON captacao_radar_oportunidades(status);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_oportunidades_score ON captacao_radar_oportunidades(score DESC);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_oportunidades_data_encerramento ON captacao_radar_oportunidades(data_encerramento);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_oportunidades_area ON captacao_radar_oportunidades(area);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_oportunidades_elegivel ON captacao_radar_oportunidades(elegivel_prefeitura);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_oportunidades_hash ON captacao_radar_oportunidades(hash_unico);

-- Trigger: atualizar updated_at
CREATE OR REPLACE TRIGGER trigger_captacao_radar_oportunidades_updated_at
BEFORE UPDATE ON captacao_radar_oportunidades
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS: multi-tenancy
ALTER TABLE captacao_radar_oportunidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_veem_apenas_seu_municipio_oportunidades"
  ON captacao_radar_oportunidades
  FOR ALL
  USING (municipio_id = (SELECT municipio_id FROM usuarios_internos WHERE auth_user_id = auth.uid() LIMIT 1));

-- ============================================================================
-- 2. TABELA: captacao_radar_fontes (melhorada)
-- URLs e APIs a monitorar para descoberta automática
-- ============================================================================

CREATE TABLE IF NOT EXISTS captacao_radar_fontes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id UUID NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  
  -- Identificação
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(100) NOT NULL, -- governo_federal, estadual, municipal, empresa, fundacao, ong
  
  -- Endpoints
  url_site VARCHAR(2000),
  api_endpoint VARCHAR(2000), -- Se a fonte tiver API estruturada
  
  -- Monitoramento
  ativa BOOLEAN DEFAULT TRUE,
  frequencia_atualizacao INTEGER DEFAULT 24, -- horas
  ultima_atualizacao TIMESTAMP,
  proximo_agendamento TIMESTAMP,
  
  -- Configuração de coleta
  metodo_coleta VARCHAR(50) DEFAULT 'web' CHECK (metodo_coleta IN ('api', 'web', 'email', 'manual')),
  parametros_coleta JSONB DEFAULT '{}'::jsonb, -- {xpath: '...', seletor: '...', auth_token: '...'}
  
  -- Status
  ultima_verificacao_erro TEXT,
  total_oportunidades_encontradas INTEGER DEFAULT 0,
  ativa_desde TIMESTAMP DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_captacao_radar_fontes_municipio ON captacao_radar_fontes(municipio_id);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_fontes_ativa ON captacao_radar_fontes(ativa);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_fontes_proximo_agendamento ON captacao_radar_fontes(proximo_agendamento) WHERE ativa = TRUE;
CREATE INDEX IF NOT EXISTS idx_captacao_radar_fontes_tipo ON captacao_radar_fontes(tipo);

-- Trigger
CREATE OR REPLACE TRIGGER trigger_captacao_radar_fontes_updated_at
BEFORE UPDATE ON captacao_radar_fontes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE captacao_radar_fontes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_veem_apenas_seu_municipio_fontes"
  ON captacao_radar_fontes
  FOR ALL
  USING (municipio_id = (SELECT municipio_id FROM usuarios_internos WHERE auth_user_id = auth.uid() LIMIT 1));

-- ============================================================================
-- 3. TABELA: captacao_radar_historico_score
-- Auditoria completa de mudanças de score
-- ============================================================================

CREATE TABLE IF NOT EXISTS captacao_radar_historico_score (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id UUID NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  oportunidade_id UUID NOT NULL REFERENCES captacao_radar_oportunidades(id) ON DELETE CASCADE,
  
  -- Scores
  score_anterior NUMERIC(5,2),
  score_novo NUMERIC(5,2) NOT NULL,
  
  -- Detalhe de critérios
  criterios_anterior JSONB,
  criterios_novo JSONB NOT NULL,
  
  -- Motivo
  motivo_mudanca VARCHAR(500),
  alterado_por VARCHAR(100) DEFAULT 'sistema', -- user_id ou 'sistema'
  
  -- Timestamp
  alterado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_captacao_radar_historico_oportunidade ON captacao_radar_historico_score(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_historico_municipio ON captacao_radar_historico_score(municipio_id);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_historico_data ON captacao_radar_historico_score(alterado_em DESC);

-- RLS
ALTER TABLE captacao_radar_historico_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_veem_apenas_seu_municipio_historico"
  ON captacao_radar_historico_score
  FOR ALL
  USING (municipio_id = (SELECT municipio_id FROM usuarios_internos WHERE auth_user_id = auth.uid() LIMIT 1));

-- ============================================================================
-- 4. TABELA: captacao_radar_vinculacoes
-- Rastreamento de vínculo oportunidade → projeto
-- ============================================================================

CREATE TABLE IF NOT EXISTS captacao_radar_vinculacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id UUID NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  
  -- Relação
  oportunidade_id UUID NOT NULL REFERENCES captacao_radar_oportunidades(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES captacao_projetos(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'vinculada' CHECK (status IN ('vinculada', 'candidata', 'concluida', 'desvinculada')),
  
  -- Dados da vinculação
  data_vinculacao TIMESTAMP DEFAULT NOW(),
  vinculada_por UUID NOT NULL REFERENCES usuarios_internos(id) ON DELETE SET NULL,
  
  -- Resultado
  resultado VARCHAR(500), -- "Projeto aprovado", "Não atendeu requisitos", etc
  desvinculada_em TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_captacao_radar_vinculacoes_oportunidade ON captacao_radar_vinculacoes(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_vinculacoes_projeto ON captacao_radar_vinculacoes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_captacao_radar_vinculacoes_municipio ON captacao_radar_vinculacoes(municipio_id);

-- Trigger
CREATE OR REPLACE TRIGGER trigger_captacao_radar_vinculacoes_updated_at
BEFORE UPDATE ON captacao_radar_vinculacoes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE captacao_radar_vinculacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_veem_apenas_seu_municipio_vinculacoes"
  ON captacao_radar_vinculacoes
  FOR ALL
  USING (municipio_id = (SELECT municipio_id FROM usuarios_internos WHERE auth_user_id = auth.uid() LIMIT 1));

-- ============================================================================
-- 5. FUNÇÃO AUXILIAR: hash_unico para deduplicação
-- ============================================================================

CREATE OR REPLACE FUNCTION gerar_hash_oportunidade(titulo VARCHAR, url VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN encode(digest(CONCAT(titulo, '|', url), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 6. VIEW: oportunidades prioritárias
-- Oportunidades de alto score com prazo curto
-- ============================================================================

CREATE OR REPLACE VIEW vw_captacao_radar_prioritarias AS
SELECT
  o.id,
  o.municipio_id,
  o.titulo,
  o.area,
  o.tipo,
  o.score,
  o.valor_estimado,
  o.data_encerramento,
  EXTRACT(DAY FROM (o.data_encerramento - NOW())) AS dias_para_encerramento,
  f.nome AS fonte_nome,
  o.status,
  o.created_at
FROM captacao_radar_oportunidades o
LEFT JOIN captacao_radar_fontes f ON o.fonte_id = f.id
WHERE o.score >= 70
  AND o.status NOT IN ('descartada', 'arquivada')
  AND (o.data_encerramento IS NULL OR o.data_encerramento > NOW())
ORDER BY o.score DESC, o.data_encerramento ASC;

-- ============================================================================
-- 7. FUNCTION: calcular_score (será chamado por TypeScript)
-- Retorna score 0-100 baseado em critérios
-- ============================================================================

CREATE OR REPLACE FUNCTION calcular_score_oportunidade(
  p_area VARCHAR,
  p_valor NUMERIC,
  p_data_encerramento DATE,
  p_dias_descoberta INTEGER,
  p_score_aderencia NUMERIC
)
RETURNS TABLE (
  score_final NUMERIC,
  detalhe JSONB
) AS $$
DECLARE
  v_score_area NUMERIC := 0;
  v_score_valor NUMERIC := 0;
  v_score_prazo NUMERIC := 0;
  v_score_aderencia NUMERIC := 0;
  v_score_novidade NUMERIC := 0;
  v_score_total NUMERIC := 0;
  v_dias_faltando INTEGER := 0;
BEGIN
  -- CRITÉRIO 1: Área (0-20)
  IF p_area IN ('cultura', 'turismo', 'artes') THEN
    v_score_area := 20;
  ELSIF p_area IN ('educacao', 'assistencia', 'saude') THEN
    v_score_area := 10;
  ELSE
    v_score_area := 5;
  END IF;

  -- CRITÉRIO 2: Valor (0-20)
  IF p_valor IS NOT NULL THEN
    IF p_valor >= 500000 THEN
      v_score_valor := 20;
    ELSIF p_valor >= 200000 THEN
      v_score_valor := 18;
    ELSIF p_valor >= 100000 THEN
      v_score_valor := 15;
    ELSIF p_valor >= 50000 THEN
      v_score_valor := 12;
    ELSIF p_valor >= 20000 THEN
      v_score_valor := 10;
    ELSE
      v_score_valor := 5;
    END IF;
  END IF;

  -- CRITÉRIO 3: Prazo (0-20)
  IF p_data_encerramento IS NOT NULL THEN
    v_dias_faltando := EXTRACT(DAY FROM (p_data_encerramento - NOW()))::INTEGER;
    IF v_dias_faltando <= 7 THEN
      v_score_prazo := 20;
    ELSIF v_dias_faltando <= 30 THEN
      v_score_prazo := 18;
    ELSIF v_dias_faltando <= 60 THEN
      v_score_prazo := 15;
    ELSIF v_dias_faltando <= 90 THEN
      v_score_prazo := 12;
    ELSE
      v_score_prazo := 8;
    END IF;
  END IF;

  -- CRITÉRIO 4: Aderência com projetos (0-20)
  v_score_aderencia := COALESCE(p_score_aderencia, 0);
  v_score_aderencia := LEAST(v_score_aderencia, 20);

  -- CRITÉRIO 5: Novidade (0-20)
  IF p_dias_descoberta <= 1 THEN
    v_score_novidade := 20;
  ELSIF p_dias_descoberta <= 7 THEN
    v_score_novidade := 15;
  ELSIF p_dias_descoberta <= 30 THEN
    v_score_novidade := 10;
  ELSE
    v_score_novidade := 5;
  END IF;

  -- Total
  v_score_total := v_score_area + v_score_valor + v_score_prazo + v_score_aderencia + v_score_novidade;
  v_score_total := LEAST(v_score_total, 100);

  RETURN QUERY SELECT
    v_score_total::NUMERIC,
    jsonb_build_object(
      'area', v_score_area,
      'valor', v_score_valor,
      'prazo', v_score_prazo,
      'aderencia', v_score_aderencia,
      'novidade', v_score_novidade
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
