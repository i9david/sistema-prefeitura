/**
 * TESTE MANUAL DO SISTEMA RADAR
 * 
 * Siga os passos abaixo para validar a implementação
 */

// =============================================================================
// PASSO 1: EXECUTAR SQL
// =============================================================================

/*
1.1. Abra o Supabase Dashboard
     → SQL Editor → Crie uma nova Query
     
1.2. Cole o conteúdo de: supabase/captacao-radar-avancado.sql
     
1.3. Execute a query
     
1.4. Verifique se tabelas foram criadas:
     SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name LIKE 'captacao_radar%';
     
     Esperado: 4 tabelas + 1 view + 1 function
*/

// =============================================================================
// PASSO 2: CONFIGURAR AMBIENTE
// =============================================================================

/*
2.1. Adicione ao .env.local:

CRON_SECRET=sua_chave_super_segura_aqui
MUNICIPIO_MINEIROS_ID=seu_uuid_do_municipio

2.2. Reinicie o servidor Next.js
*/

// =============================================================================
// PASSO 3: TESTAR COLETA DE DADOS
// =============================================================================

/*
3.1. Teste manual no seu navegador ou curl:

curl -X POST \
  http://localhost:3000/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer sua_chave_super_segura_aqui"

Esperado: JSON com sucesso: true e resultado com números > 0

3.2. Verifique dados no Supabase:
     SELECT COUNT(*) FROM captacao_radar_oportunidades;
     
     SELECT * FROM captacao_radar_oportunidades 
     ORDER BY created_at DESC LIMIT 5;
*/

// =============================================================================
// PASSO 4: TESTAR LIMPEZA DE EXPIRADAS
// =============================================================================

/*
4.1. Teste endpoint de limpeza:

curl -X PUT \
  http://localhost:3000/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer sua_chave_super_segura_aqui"

Esperado: JSON com sucesso: true e arquivadas: N

4.2. Verifique status em banco:
     SELECT status, COUNT(*) 
     FROM captacao_radar_oportunidades 
     GROUP BY status;
*/

// =============================================================================
// PASSO 5: TESTAR RECÁLCULO DE SCORES
// =============================================================================

/*
5.1. Teste endpoint de recalculação:

curl -X PATCH \
  http://localhost:3000/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer sua_chave_super_segura_aqui"

Esperado: JSON com sucesso: true e recalculados: N

5.2. Verifique histórico:
     SELECT * 
     FROM captacao_radar_historico_score 
     ORDER BY created_at DESC LIMIT 5;
*/

// =============================================================================
// PASSO 6: TESTAR PÁGINA DO RADAR
// =============================================================================

/*
6.1. Navegue para: http://localhost:3000/projetos-captacao/radar

6.2. Você deve ver:
     ✅ Header "Radar de Oportunidades"
     ✅ 4 cards de métricas
     ✅ Lista de oportunidades (se houver dados)
     ✅ Filtros por área e score
     ✅ Cards com scores coloridos

6.3. Teste filtros:
     - Clique em "Filtros"
     - Selecione área "cultura"
     - Arraste score para 70+
     - Clique "Aplicar Filtros"
     - URL deve mudar para: ?area=cultura&score=70
     
6.4. Teste card de oportunidade:
     - Clique em uma oportunidade
     - Deve levar a página de detalles (a fazer)
*/

// =============================================================================
// PASSO 7: TESTAR AÇÕES NO BANCO
// =============================================================================

/*
7.1. Vincular oportunidade a projeto (via seu código):

import { vincularOportunidadeAoProjeto } from '@/lib/captacao-radar-actions'

const resultado = await vincularOportunidadeAoProjeto(
  'uuid_da_oportunidade',
  'uuid_do_projeto'
)

Verifique em: SELECT * FROM captacao_radar_vinculacoes WHERE status = 'ativa'

7.2. Descartar oportunidade:

import { descartarOportunidade } from '@/lib/captacao-radar-actions'

const resultado = await descartarOportunidade(
  'uuid_da_oportunidade',
  'Motivo: duplicata'
)

Verifique: SELECT status FROM captacao_radar_oportunidades WHERE id = '...'
Esperado: status = 'descartada'

7.3. Obter estatísticas:

import { obterEstatisticasRadar } from '@/lib/captacao-radar-actions'

const stats = await obterEstatisticasRadar()
console.log(stats)

Esperado: { total: N, prazoCurto: N, scoreMedio: N.N, ... }

7.4. Listar com filtros:

import { listarOportunidades } from '@/lib/captacao-radar-actions'

const resultado = await listarOportunidades({
  area: 'cultura',
  minScore: 70,
  limite: 20,
  offset: 0
})

Esperado: { oportunidades: [...], total: N }
*/

// =============================================================================
// PASSO 8: TESTAR SEGURANÇA
// =============================================================================

/*
8.1. Teste com token inválido (deve falhar):

curl -X POST \
  http://localhost:3000/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer token_errado"

Esperado: 401 Não autorizado

8.2. Teste sem header (deve falhar):

curl -X POST \
  http://localhost:3000/api/projetos-captacao/radar/atualizar

Esperado: 401 Não autorizado

8.3. Verifique RLS no Supabase:
     - Cada usuário só vê dados do seu municipio_id
     - Tente fazer SELECT como outro usuário
     - Esperado: vazio ou erro de RLS
*/

// =============================================================================
// PASSO 9: CONFIGURAR AGENDAMENTO (PRODUÇÃO)
// =============================================================================

/*
9.1. Escolha seu método:

OPÇÃO A - Vercel Crons (se usar Vercel):
---------
Crie/edite vercel.json na raiz do projeto:

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

OPÇÃO B - Cron Linux (servidor próprio):
---------
crontab -e

# Coleta a cada 24 horas às 2:00
0 2 * * * curl -s -X POST \
  https://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET" \
  >> /var/log/radar-coleta.log 2>&1

# Recalcula scores a cada 3 dias às 5:00
0 5 * * 0 curl -s -X PATCH \
  https://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET" \
  >> /var/log/radar-recalc.log 2>&1

OPÇÃO C - GitHub Actions:
---------
Crie .github/workflows/radar-coleta.yml:

name: Radar Coleta Automática

on:
  schedule:
    - cron: '0 2 * * *'  # 2am UTC

jobs:
  coleta:
    runs-on: ubuntu-latest
    steps:
      - name: Disparar coleta
        run: |
          curl -X POST \
            https://seu-dominio.com/api/projetos-captacao/radar/atualizar \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
*/

// =============================================================================
// PASSO 10: CHECKLIST FINAL
// =============================================================================

/*
✅ SQL executado e tabelas criadas
✅ .env.local configurado com CRON_SECRET e MUNICIPIO_ID
✅ Servidor Next.js reiniciado
✅ Coleta de dados funcionando (POST /api/.../atualizar)
✅ Página do Radar acessível em /projetos-captacao/radar
✅ Filtros funcionando corretamente
✅ Oportunidades exibindo com scores
✅ Limpeza de expiradas funcionando (PUT /api/.../atualizar)
✅ Recálculo de scores funcionando (PATCH /api/.../atualizar)
✅ RLS funcionando (dados isolados por municipio)
✅ Cron job agendado para produção
✅ Testes de segurança passando

Se tudo passou: Sistema está pronto para produção! 🚀
*/

// =============================================================================
// TROUBLESHOOTING
// =============================================================================

/*
❌ Problema: "Não autorizado" no POST
   → Verificar se CRON_SECRET está correto
   → Verificar se header Authorization está correto
   
❌ Problema: Nenhuma oportunidade foi salva
   → Verificar se municipio_id está correto
   → Verificar logs do servidor
   → Verificar se MUNICIPIO_MINEIROS_ID está em .env
   
❌ Problema: Tabelas não foram criadas
   → Verificar se execute SQL na íntegra
   → Verificar se usuário tem permissão
   → Tentar criar cada tabela manualmente
   
❌ Problema: Página do Radar dá erro 500
   → Verificar se SQL foi executado
   → Verificar console do navegador
   → Verificar logs do servidor
   
❌ Problema: Filtros não funcionam
   → Verificar se dados existem no banco
   → Verificar se query URL está correta (?area=cultura)
   → Tentar limpar cache do navegador
   
❌ Problema: Score não calcula
   → Verificar se função calcular_score_oportunidade existe
   → Verificar se valor é um número válido
   → Tentar executar função diretamente no Supabase
*/

// =============================================================================
// EXEMPLO DE USO EM COMPONENTE
// =============================================================================

/*
'use client'

import { useEffect, useState } from 'react'
import { obterEstatisticasRadar, listarOportunidades } from '@/lib/captacao-radar-actions'

export function MeuComponente() {
  const [stats, setStats] = useState(null)
  const [oportunidades, setOportunidades] = useState([])

  useEffect(() => {
    async function carregar() {
      const s = await obterEstatisticasRadar()
      setStats(s)

      const { oportunidades: opps } = await listarOportunidades({
        limite: 10,
        offset: 0,
        minScore: 70
      })
      setOportunidades(opps)
    }

    carregar()
  }, [])

  if (!stats) return <div>Carregando...</div>

  return (
    <div>
      <h2>Total: {stats.total}</h2>
      <ul>
        {oportunidades.map(opp => (
          <li key={opp.id}>
            {opp.titulo} - Score: {opp.score}
          </li>
        ))}
      </ul>
    </div>
  )
}
*/

export default {}
