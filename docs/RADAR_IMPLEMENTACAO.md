# 🎯 SISTEMA AVANÇADO DE RADAR DE CAPTAÇÃO - PLANO DE IMPLEMENTAÇÃO

## ✅ FASES ENTREGUES

### FASE 1: Arquitetura do Radar ✅
**Arquivo:** `supabase/captacao-radar-avancado.sql`

Tabelas implementadas:
1. **captacao_radar_oportunidades** (centralizada)
   - Campos principais: titulo, url, tipo, area, valor, scores
   - Índices para performance (status, score, area, data_encerramento)
   - RLS com proteção multi-tenancy
   - Trigger para atualizar updated_at

2. **captacao_radar_fontes** (URLs e APIs a monitorar)
   - Configuração de fontes: governo federal, estadual, fundações
   - Frequência de atualização automática
   - Método de coleta (api, web, email)
   - Histórico de atualizações

3. **captacao_radar_historico_score** (auditoria)
   - Rastreamento de mudanças de score
   - Detalhamento de critérios
   - Histórico completo para análise

4. **captacao_radar_vinculacoes** (rastreamento)
   - Ligação oportunidade ↔ projeto
   - Status de vinculação
   - Histórico de resultados

5. **VIEW: vw_captacao_radar_prioritarias**
   - Oportunidades de alto score com prazo curto
   - Ordenação por prioridade automática

6. **FUNCTION: calcular_score_oportunidade()**
   - Cálculo inteligente de score 0-100
   - Critérios: área, valor, prazo, aderência, novidade
   - Retorna detalhe JSON para auditoria

---

### FASE 2: Coleta de Dados ✅
**Arquivo:** `lib/captacao-radar-coleta.ts`

Funções implementadas:
- `coletarOportunidadesSICV()` - API Convênios Governo Federal
- `coletarOportunidadesRouanet()` - Lei de Incentivo à Cultura
- `coletarOportunidadesFundacoes()` - BNDES, FBB e outras
- `coletarOportunidadesGoias()` - SEDECT-GO (estadual)
- `executarColetaCompleta()` - Orquestra todas as fontes

**Características:**
- APIs estruturadas (SEM scraping agressivo)
- Cache com revalidate automático
- Tratamento de erros robusto
- Deduplicação por SHA256 hash

---

### FASE 3: Classificação Automática ✅
**Arquivo:** `lib/captacao-radar-coleta.ts`

Funções:
- `classificarOportunidade()` - Classifica automaticamente
- `detectarTipo()` - Identifica tipo (edital, convenio, etc)
- `detectarArea()` - Mapeia 8 áreas diferentes
- `verificarElegibilidade()` - Valida elegibilidade para prefeitura

**Lógica:**
- Análise de palavras-chave em título e descrição
- Suporte a múltiplas variações (acentos, maiúsculas)
- Critérios de exclusão claros (empresa privada, universidades)
- Score de confiança (true/false/null para validação manual)

---

### FASE 4: Score Inteligente ✅
**Arquivo:** `supabase/captacao-radar-avancado.sql` + `lib/captacao-radar-coleta.ts`

**Critérios de Scoring (0-100):**

| Critério | Pontos | Lógica |
|----------|--------|--------|
| **Área Compatível** | 0-20 | Cultura/turismo = 20, outros = menos |
| **Valor do Recurso** | 0-20 | 500k+ = 20; 200k+ = 18; até 20k = 5 |
| **Prazo** | 0-20 | <7 dias = 20; <30 = 18; <90 = 15 |
| **Aderência** | 0-20 | Compatibilidade com projetos cadastrados |
| **Novidade** | 0-20 | Descoberto hoje = 20; dias atrás = menos |
| **TOTAL** | **0-100** | Soma ponderada inteligente |

**Características:**
- Cálculo em SQL puro para performance
- Auditoria completa em histórico_score
- Recalculação automática quando oportunidade muda
- Critérios adaptáveis via função

---

### FASE 5: UX do Radar ✅
**Arquivos:**
- `app/projetos-captacao/radar/page-new.tsx` - Server Component
- `app/projetos-captacao/radar/radar-client.tsx` - Client Component interativo

**Features:**
- ✅ Lista com 20 oportunidades por página
- ✅ Filtros por: área, score mínimo
- ✅ Destaque automático de prioritárias (score 70+)
- ✅ Cards com score colorido (verde/amarelo/cinza)
- ✅ Badges de status e tipo
- ✅ Valor formatado em K (R$ 100k)
- ✅ Data de encerramento legível
- ✅ Estatísticas em dashboard
- ✅ Histórico de atualizações de fontes

---

### FASE 6: Automação ✅
**Arquivo:** `app/api/projetos-captacao/radar/route.ts`

**Endpoints:**

```bash
# 1. Coleta completa (executar a cada 24h)
curl -X POST \
  http://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "X-Municipio-ID: $MUNICIPIO_ID"

# 2. Limpar oportunidades expiradas
curl -X PUT \
  http://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET"

# 3. Recalcular scores (executar a cada 72h)
curl -X PATCH \
  http://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Segurança:**
- Validação de token via `CRON_SECRET` env
- Suporte a `X-Municipio-ID` header
- Logs estruturados para debugging
- Tratamento de erros robusto

---

### FASE 7: Integração com Projetos ✅
**Arquivo:** `lib/captacao-radar-actions.ts`

**Funções:**
- `vincularOportunidadeAoProjeto()` - Liga oportunidade a projeto
- `desvinculaOportunidadeDoProjeto()` - Desliga com motivo
- `criarProjetoAPartirOportunidade()` - Cria novo projeto automaticamente
- `descartarOportunidade()` - Marca como descartada
- `arquivarOportunidade()` - Arquiva após encerramento
- `obterOportunidadeDetalhes()` - Traz tudo (vinculações, histórico)
- `obterEstatisticasRadar()` - Dados para dashboard

---

## 📋 CONFIGURAÇÃO NECESSÁRIA

### 1. Variáveis de Ambiente

```env
# Autenticação da rotina de coleta
CRON_SECRET=seu_token_aleatorio_super_seguro

# Municipio padrão
MUNICIPIO_MINEIROS_ID=uuid_do_municipio

# (Opcional) APIs externas
OPENAI_API_KEY=sk-... # Para análises futuras com IA
```

### 2. SQL - Executar no Supabase

```sql
-- 1. Executar o arquivo supabase/captacao-radar-avancado.sql
-- 2. Verificar se função update_updated_at_column() existe:

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Agendamento (Cron Job)

**Opção A: Vercel Crons**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/projetos-captacao/radar/atualizar",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/projetos-captacao/radar/atualizar",
      "schedule": "0 5 * * 0"
    }
  ]
}
```

**Opção B: Supabase Webhooks**
```sql
-- Criar webhook que chama sua API
SELECT
  http_post(
    'https://seu-dominio.com/api/projetos-captacao/radar/atualizar',
    '{}',
    'http_headers'::text,
    jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    )
  );
```

**Opção C: External Service (AWS Lambda, Google Cloud Functions)**
```bash
# Disparar via CLI a cada 24 horas
0 2 * * * curl -X POST \
  https://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🔗 FLUXO COMPLETO

```
1. COLETA
   ├─ API SICONV (Convênios Federais)
   ├─ Rouanet (Lei de Incentivo)
   ├─ BNDES + FBB (Fundações)
   └─ SEDECT-GO (Estadual)

2. PROCESSAMENTO
   ├─ Classificar (tipo, área, elegibilidade)
   ├─ Deduplica (SHA256 hash)
   ├─ Calcula Score (5 critérios)
   └─ Salva em captacao_radar_oportunidades

3. APRESENTAÇÃO
   ├─ Dashboard com estatísticas
   ├─ Lista filtrada por área/score
   ├─ Destaque de prioritárias
   └─ Ações: vincular ou criar projeto

4. INTEGRAÇÃO
   ├─ Vincular a projeto existente
   ├─ Criar projeto automaticamente
   ├─ Rastrear em captacao_radar_vinculacoes
   └─ Arquivar ao encerrar

5. AUTOMAÇÃO
   ├─ Cron a cada 24h: coleta completa
   ├─ Cron a cada 72h: recalcula scores
   └─ Cron semanal: limpa expiradas
```

---

## 🚀 PRÓXIMAS ETAPAS (FUTURO)

1. **Análise com IA (OpenAI)**
   - Extração automática de requisitos
   - Análise de documentos necessários
   - Recomendações inteligentes

2. **Notificações**
   - Email quando oportunidade score > 80
   - Slack/Teams para equipe
   - Push notifications

3. **Relatórios**
   - Oportunidades por mês
   - Análise de fontes mais relevantes
   - ROI (projetos aprovados vs oportunidades)

4. **IA para Matching**
   - Algoritmo ML para aderência
   - Histórico de sucesso/falha
   - Predição de aprovação

---

## 📊 PERFORMANCE & ESCALABILIDADE

- **Índices:** Otimizados para queries mais comuns
- **RLS:** Proteção automática multi-tenancy
- **Cache:** Revalidate 5min na UI
- **Paginação:** Limit 20 por página
- **Batch:** Coleta em paralelo com Promise.all()

---

## 🔐 SEGURANÇA

- ✅ Multi-tenancy via RLS
- ✅ Validação de token em API routes
- ✅ Sem dados sensíveis em logs
- ✅ Sem scraping agressivo (apenas APIs)
- ✅ Auditoria completa em histórico

---

## ✨ DIFERENCIAL DO SISTEMA

✅ Trabalha com **fontes estruturadas e confiáveis**
✅ **Score inteligente** com 5 critérios ponderados
✅ **Integração perfeita** com projetos existentes
✅ **Automação robusta** sem intervenção manual
✅ **Multi-tenancy** seguro
✅ **Performance otimizada** com índices e cache
✅ **Zero scraping agressivo** - APIs públicas apenas

---

## 📞 SUPORTE TÉCNICO

Para integração com suas APIs:
1. Adicionar função em `lib/captacao-radar-coleta.ts`
2. Seguir padrão de retorno (OportunidadeRaw)
3. Adicionar em `executarColetaCompleta()`
4. Testar com coleta manual

Exemplo:
```typescript
export async function coletarOportunidadesMinhaFonte() {
  const response = await fetch('https://api.exemplo.com/editais')
  const dados = await response.json()
  
  return dados.editais.map(e => ({
    titulo: e.nome,
    descricao: e.descricao,
    url: e.link,
    fonte: 'Minha Fonte',
    fonteTipo: 'governo_estadual',
    valor: e.valor_disponivel,
    dataEncerramento: new Date(e.prazo_fim),
    areaDetectada: detectarArea(e.descricao)
  }))
}
```

---

**Status: ✅ PRONTO PARA PRODUÇÃO**

Todos os componentes foram implementados seguindo:
- ✅ Padrões do AGENTS.md
- ✅ Segurança multi-tenancy
- ✅ Performance otimizada
- ✅ Código sem genéricos
- ✅ Fontes estruturadas apenas
