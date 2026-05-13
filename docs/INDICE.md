# 📚 ÍNDICE COMPLETO - SISTEMA RADAR DE CAPTAÇÃO

## 🚀 INÍCIO RÁPIDO

**Novo no sistema?** Comece aqui:
→ [RADAR_QUICKSTART.md](RADAR_QUICKSTART.md) - 5 passos para começar em 5 minutos

---

## 📂 ARQUIVOS TÉCNICOS (Backend)

### 1. Schema do Banco de Dados
**Arquivo:** `supabase/captacao-radar-avancado.sql`

O que contém:
- ✅ 4 tabelas principais
- ✅ 1 view para priorização
- ✅ 1 função SQL para cálculo de score
- ✅ RLS (Row Level Security) para multi-tenancy
- ✅ 6+ índices de performance
- ✅ Triggers para auditoria

**Como usar:**
1. Copiar conteúdo inteiro
2. Supabase Dashboard → SQL Editor
3. Colar e executar
4. Aguardar ~30 segundos

**Tabelas criadas:**
- `captacao_radar_oportunidades` - Centralizador de todas as oportunidades
- `captacao_radar_fontes` - URLs/APIs a monitorar
- `captacao_radar_historico_score` - Auditoria de mudanças
- `captacao_radar_vinculacoes` - Vinculação com projetos

---

### 2. Lógica de Coleta de Dados
**Arquivo:** `lib/captacao-radar-coleta.ts`

O que contém:
- ✅ `coletarOportunidadesSICV()` - API Convênios Federais
- ✅ `coletarOportunidadesRouanet()` - Lei de Incentivo
- ✅ `coletarOportunidadesFundacoes()` - BNDES + FBB
- ✅ `coletarOportunidadesGoias()` - SEDECT-GO
- ✅ `classificarOportunidade()` - Auto-classificação
- ✅ `calcularScore()` - Score inteligente
- ✅ `executarColetaCompleta()` - Orquestra tudo

**Principais funções:**
```typescript
// Coletar tudo
const resultado = await executarColetaCompleta(municipioId)

// Verificar duplicata
const existe = await verificarDuplicata(url, titulo)

// Calcular score
const score = await calcularScore(dados, municipioId)

// Gerar hash
const hash = gerarHashOportunidade(titulo, url)
```

**Características:**
- Deduplicação automática por SHA256
- Classificação inteligente (tipo, área, elegibilidade)
- Score com 5 critérios
- Tratamento robusto de erros
- Logging estruturado

---

### 3. Server Actions (Funções do Backend)
**Arquivo:** `lib/captacao-radar-actions.ts`

O que contém:
- ✅ `listarOportunidades()` - Lista com filtros
- ✅ `obterOportunidadeDetalhes()` - Informações completas
- ✅ `obterOportunidadesPrioritarias()` - Score 70+ e prazo < 7
- ✅ `obterEstatisticasRadar()` - Métricas dashboard
- ✅ `vincularOportunidadeAoProjeto()` - Linkar com projeto
- ✅ `desvinculaOportunidadeDoProjeto()` - Deslinkar
- ✅ `criarProjetoAPartirOportunidade()` - Auto-criar projeto
- ✅ `descartarOportunidade()` - Marcar descartada
- ✅ `arquivarOportunidade()` - Arquivar expirada

**Uso:**
```typescript
// Listar com filtros
const { oportunidades, total } = await listarOportunidades({
  area: 'cultura',
  minScore: 70,
  status: 'nova',
  limite: 20,
  offset: 0
})

// Vincular
await vincularOportunidadeAoProjeto(oportunidadeId, projetoId)

// Estatísticas
const stats = await obterEstatisticasRadar()
```

---

### 4. API Routes (Endpoints REST)
**Arquivo:** `app/api/projetos-captacao/radar/route.ts`

O que contém:
- ✅ `POST /api/projetos-captacao/radar/atualizar` - Coleta completa
- ✅ `PUT /api/projetos-captacao/radar/atualizar` - Arquiva expiradas
- ✅ `PATCH /api/projetos-captacao/radar/atualizar` - Recalcula scores

**Como usar:**
```bash
# Coleta completa
curl -X POST \
  http://seu-dominio/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET"

# Limpa expiradas
curl -X PUT \
  http://seu-dominio/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET"

# Recalcula scores
curl -X PATCH \
  http://seu-dominio/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Segurança:**
- Validação de token `CRON_SECRET`
- Suporte a `X-Municipio-ID` header
- RLS automático
- Logs estruturados

---

## 🎨 ARQUIVOS DE UI (Frontend)

### 5. Página Principal (Server Component)
**Arquivo:** `app/projetos-captacao/radar/page-new.tsx`

O que contém:
- ✅ Header com título e descrição
- ✅ 4 cards de métricas (total, prazo curto, score médio, fontes)
- ✅ Seção de oportunidades prioritárias
- ✅ Integração com componente client
- ✅ Última atualização das fontes

**Características:**
- `revalidate = 300` para cache de 5 minutos
- Layout reutilizável (ModuleLayout)
- Responsive (mobile-first)

**⚠️ Nota:** Renomear para `page.tsx` após download

---

### 6. Componente Interativo (Client Component)
**Arquivo:** `app/projetos-captacao/radar/radar-client.tsx`

O que contém:
- ✅ Filtros interativos (área, score)
- ✅ Lista de oportunidades com cards
- ✅ Scores coloridos (verde/amarelo/cinza)
- ✅ Badges de status
- ✅ Valores formatados
- ✅ Paginação

**Características:**
- `React.memo` para performance
- `useCallback` para handlers
- Modais para ações
- UX fluida

---

### 7. Página de Detalhe (Server Component)
**Arquivo:** `app/projetos-captacao/radar/[id]/page.tsx`

O que contém:
- ✅ Informações completas da oportunidade
- ✅ 4 cards principais (score, área, valor, encerramento)
- ✅ Breakdown detalhado do score (barras por critério)
- ✅ Elegibilidade verificada
- ✅ URL da fonte com link
- ✅ Status e data de descoberta
- ✅ Descrição completa
- ✅ Vinculações com projetos
- ✅ Histórico de scores

---

### 8. Componente de Ações (Client Component)
**Arquivo:** `app/projetos-captacao/radar/[id]/detalhe-client.tsx`

O que contém:
- ✅ Botão "Criar Novo Projeto"
- ✅ Botão "Vincular a Projeto Existente"
- ✅ Botão "Descartar"
- ✅ Modal para descartar (com motivo)
- ✅ Modal para vincular (seleção)
- ✅ Modal para criar (confirmação)
- ✅ Feedback visual (sucesso/erro)
- ✅ Loading states

---

## 📚 DOCUMENTAÇÃO

### 9. Quick Start Guide
**Arquivo:** `docs/RADAR_QUICKSTART.md`

Para quem quer começar AGORA:
- ⚡ TL;DR (resumo em 60 segundos)
- 🎯 O que funciona
- 🚀 Começar em 5 minutos
- 📖 Links para docs detalhadas
- 🆘 Problemas comuns

**Tempo de leitura:** 5 minutos

---

### 10. Guia de Implementação Técnica
**Arquivo:** `docs/RADAR_IMPLEMENTACAO.md`

Para entender como funciona:
- 📋 Explicação das 7 fases
- 🔐 Segurança e RLS
- ⚙️ Configuração de ambiente
- 📊 Performance e escalabilidade
- 🔄 Integração com sistema existente
- 💡 Extensões futuras

**Tempo de leitura:** 15 minutos

---

### 11. Guia de Testes Manual
**Arquivo:** `docs/RADAR_TESTES.md`

Para validar tudo antes de produção:
- 10 passos de teste
- ✅ Exemplos de curl
- 📊 Queries SQL para validação
- 🔐 Testes de segurança
- 🐛 Troubleshooting completo
- 💻 Exemplos de uso em componentes

**Tempo de leitura:** 20 minutos

---

### 12. Configuração e Checklist
**Arquivo:** `docs/RADAR_ENV_E_CHECKLIST.md`

Para deploy em produção:
- 📋 Variáveis de ambiente
- ✅ Checklist de 6 seções
- 🚀 3 opções de deploy
- 📊 Monitoramento pós-deploy
- 🆘 Troubleshooting específico

**Tempo de leitura:** 10 minutos

---

### 13. Resumo Executivo
**Arquivo:** `docs/RADAR_RESUMO.md`

Para gestores/supervisores:
- 📦 O que foi entregue
- ✅ Checklist de qualidade
- 📋 Funcionalidades entregues
- 🏁 Pronto para produção?
- 💡 Extensões futuras

**Tempo de leitura:** 10 minutos

---

## 🗂️ MAPA RÁPIDO DE ARQUIVOS

```
Para começar agora:
└─ docs/RADAR_QUICKSTART.md ⭐ COMECE AQUI

Para entender a arquitetura:
├─ docs/RADAR_IMPLEMENTACAO.md
└─ supabase/captacao-radar-avancado.sql

Para testar localmente:
├─ docs/RADAR_TESTES.md
├─ lib/captacao-radar-coleta.ts
└─ lib/captacao-radar-actions.ts

Para configurar em produção:
├─ docs/RADAR_ENV_E_CHECKLIST.md
├─ .env.local (criar)
└─ app/api/projetos-captacao/radar/route.ts

Para usar na UI:
├─ app/projetos-captacao/radar/page-new.tsx
├─ app/projetos-captacao/radar/radar-client.tsx
├─ app/projetos-captacao/radar/[id]/page.tsx
└─ app/projetos-captacao/radar/[id]/detalhe-client.tsx
```

---

## 📈 ARQUIVOS POR PRIORIDADE

### 🔴 CRÍTICOS (fazer primeiro)
1. `supabase/captacao-radar-avancado.sql` - Executar no banco
2. `.env.local` - Configurar CRON_SECRET e MUNICIPIO_ID
3. `app/projetos-captacao/radar/page-new.tsx` - Renomear para page.tsx

### 🟡 IMPORTANTES (fazer logo depois)
4. Testar localmente com `npm run dev`
5. Testar API com curl (ver RADAR_TESTES.md)
6. Configurar cron job (ver RADAR_ENV_E_CHECKLIST.md)

### 🟢 SUPORTE (consultá-los conforme necessário)
7. Documentação técnica
8. Troubleshooting
9. Exemplos de uso

---

## 🎯 FLUXO RECOMENDADO

```
Dia 1: Preparar
├─ Ler RADAR_QUICKSTART.md (5 min)
├─ Copiar SQL e executar (10 min)
├─ Configurar .env.local (5 min)
└─ Renomear arquivo (1 min)

Dia 1: Testar Localmente
├─ npm run dev
├─ Acessar http://localhost:3000/projetos-captacao/radar
├─ Testar POST /api/.../atualizar
└─ Validar dados no Supabase

Dia 1-2: Deploy
├─ Seguir docs/RADAR_ENV_E_CHECKLIST.md
├─ Configurar cron job
└─ Fazer git push

Dia 2+: Monitorar
├─ Ver logs de coleta
├─ Validar integridade de dados
└─ Celebrar sucesso 🎉
```

---

## 📞 DÚVIDAS FREQUENTES

**P: Por onde começo?**
R: Leia `RADAR_QUICKSTART.md` (5 minutos)

**P: Como testar antes de produção?**
R: Siga `RADAR_TESTES.md` (20 minutos)

**P: Como fazer deploy?**
R: Veja `RADAR_ENV_E_CHECKLIST.md` seção "INSTRUÇÕES DE DEPLOY"

**P: Algo deu errado, como debugar?**
R: Consulte `RADAR_TESTES.md` seção "TROUBLESHOOTING"

**P: Como adicionar nova fonte de dados?**
R: Veja `RADAR_IMPLEMENTACAO.md` seção "SUPORTE TÉCNICO"

---

## 🎓 SOBRE A IMPLEMENTAÇÃO

**Arquitetura:**
- Next.js 14+ com Pages Router
- Supabase PostgreSQL
- Server Components + Client Components
- Server Actions para backend

**Segurança:**
- Multi-tenancy via RLS
- Token authentication para APIs
- Sem dados sensíveis em logs

**Performance:**
- ISR caching (5 minutos)
- SQL-based scoring
- Índices otimizados
- Paginação (20 itens)

**Qualidade:**
- Sem code genéricos
- TypeScript puro
- Error handling robusto
- Logging estruturado

---

## ✨ RESUMO

Você tem tudo para:
- ✅ Monitorar 4 fontes de oportunidades
- ✅ Classificar e pontuar automaticamente
- ✅ Integrar com projetos de captação
- ✅ Fazer tudo de forma segura e escalável

**Pronto para produção em ~15 minutos** ⏱️

---

**Última atualização:** 2025
**Status:** ✅ PRONTO PARA PRODUÇÃO

Divirta-se! 🚀
