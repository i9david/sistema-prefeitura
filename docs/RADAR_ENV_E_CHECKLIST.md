# 📋 CHECKLIST FINAL E ENV

## 🔧 CONFIGURAÇÃO DE AMBIENTE

### Copie e cole no `.env.local`:

```env
# ============================================================================
# SISTEMA RADAR DE CAPTAÇÃO
# ============================================================================

# Token para autenticar rotinas de cron job
# ⚠️ GERE UM TOKEN ALEATORIO SEGURO!
# Exemplo: openssl rand -base64 32
CRON_SECRET=seu_token_super_seguro_gerado_aqui

# UUID do município Mineiros (obter do banco de dados)
# SELECT id FROM municipios WHERE nome = 'Mineiros' LIMIT 1;
MUNICIPIO_MINEIROS_ID=seu_uuid_do_municipio_aqui

# (OPCIONAL) Para análises futuras com OpenAI
# OPENAI_API_KEY=sk-...
```

---

## ✅ CHECKLIST DE PRÉ-PRODUÇÃO

### 1. Banco de Dados
- [ ] Executei `supabase/captacao-radar-avancado.sql` no Supabase SQL Editor
- [ ] Verifiquei que as 4 tabelas foram criadas:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name LIKE 'captacao_radar%';
  ```
- [ ] Verifiquei que a view `vw_captacao_radar_prioritarias` foi criada
- [ ] Verifiquei que a função `calcular_score_oportunidade()` foi criada
- [ ] Testei a função diretamente:
  ```sql
  SELECT calcular_score_oportunidade(
    'Edital de Cultura',
    'Descricao aqui',
    'cultura',
    true,
    500000,
    '2025-02-28'
  );
  ```

### 2. Ambiente Local
- [ ] Adicionei CRON_SECRET em `.env.local`
- [ ] Adicionei MUNICIPIO_MINEIROS_ID em `.env.local`
- [ ] Reiniciei o servidor Next.js (`npm run dev`)
- [ ] Verifiquei que não há erros de TypeScript

### 3. Testes Locais
- [ ] Testei coleta manual:
  ```bash
  curl -X POST \
    http://localhost:3000/api/projetos-captacao/radar/atualizar \
    -H "Authorization: Bearer $CRON_SECRET"
  ```
- [ ] Verifiquei dados no Supabase:
  ```sql
  SELECT COUNT(*) FROM captacao_radar_oportunidades;
  ```
- [ ] Acessei a página em `http://localhost:3000/projetos-captacao/radar`
- [ ] Testei filtros (área, score)
- [ ] Cliquei em uma oportunidade para ver detalhe

### 4. Segurança
- [ ] Validei que API retorna 401 com token inválido
- [ ] Validei que API retorna 401 sem header Authorization
- [ ] Testei acesso como múltiplos usuários (RLS funciona)
- [ ] Verifiquei que não há logs com dados sensíveis

### 5. Performance
- [ ] Página carrega em < 2 segundos
- [ ] Filtros não causam lag
- [ ] Listagem com 20 itens é fluida
- [ ] Não há console warnings de React

### 6. Arquivo SQL - Verificação Final
```sql
-- Verificar que tudo foi criado
\dt captacao_radar*  -- Deve listar 4 tabelas
\dv captacao_radar*  -- Deve listar 1 view
\df calcular_score*  -- Deve listar 1 função

-- Verificar RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'captacao_radar%';
-- Esperado: rowsecurity = true para TODAS

-- Verificar índices
SELECT indexname FROM pg_indexes 
WHERE tablename LIKE 'captacao_radar%';
-- Deve ter ~6-8 índices

-- Verificar constraints
\d captacao_radar_oportunidades
-- Deve ter: id (PK), municipio_id (FK), created_at, updated_at
```

---

## 🚀 INSTRUÇÕES DE DEPLOY

### Opção A: Vercel (Recomendado)

1. **Crie o arquivo `vercel.json` na raiz:**
```json
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

2. **Configure secrets no Vercel Dashboard:**
   - `CRON_SECRET` = seu token
   - `MUNICIPIO_MINEIROS_ID` = seu UUID

3. **Faça deploy:**
```bash
git add .
git commit -m "feat: adicionar sistema radar (FASE 1-7)"
git push origin main
```

### Opção B: Servidor Linux com Crontab

1. **Crie arquivo `/var/spool/cron/crontabs/www-data` (ou seu usuário):**
```cron
# Coleta completa a cada 24 horas às 2am
0 2 * * * curl -s -X POST \
  https://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET" \
  >> /var/log/radar-coleta.log 2>&1

# Recalcula scores a cada domingo às 5am
0 5 * * 0 curl -s -X PATCH \
  https://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET" \
  >> /var/log/radar-recalc.log 2>&1

# Limpa expiradas toda quarta à noite
0 23 * * 3 curl -s -X PUT \
  https://seu-dominio.com/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer $CRON_SECRET" \
  >> /var/log/radar-cleanup.log 2>&1
```

2. **Recarregue crontab:**
```bash
sudo systemctl restart cron
```

3. **Verifique logs:**
```bash
tail -f /var/log/radar-coleta.log
```

### Opção C: GitHub Actions

1. **Crie `.github/workflows/radar-coleta.yml`:**
```yaml
name: Radar Coleta Automática

on:
  schedule:
    - cron: '0 2 * * *'

jobs:
  coleta:
    runs-on: ubuntu-latest
    steps:
      - name: Disparar coleta
        run: |
          curl -X POST \
            https://seu-dominio.com/api/projetos-captacao/radar/atualizar \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

2. **Configure secrets no GitHub:**
   - `CRON_SECRET` = seu token

3. **Faça push do arquivo:**
```bash
git add .github/workflows/radar-coleta.yml
git commit -m "ci: adicionar workflow para radar coleta"
git push origin main
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Verificar Última Coleta
```sql
SELECT 
  nome,
  ultima_atualizacao,
  proximo_agendamento,
  total_oportunidades_encontradas
FROM captacao_radar_fontes
WHERE municipio_id = 'seu_uuid'
ORDER BY ultima_atualizacao DESC;
```

### Verificar Erros Recentes
```sql
-- Se tiver tabela de logs (logs_radar ou similar)
SELECT * FROM logs_radar 
WHERE municipio_id = 'seu_uuid'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Validar Integridade de Dados
```sql
-- Verificar oportunidades por status
SELECT status, COUNT(*) 
FROM captacao_radar_oportunidades
WHERE municipio_id = 'seu_uuid'
GROUP BY status;

-- Verificar scores
SELECT 
  MIN(score) as minimo,
  MAX(score) as maximo,
  ROUND(AVG(score)::numeric, 2) as media,
  COUNT(*) as total
FROM captacao_radar_oportunidades
WHERE municipio_id = 'seu_uuid';

-- Verificar duplicatas
SELECT hash_unico, COUNT(*) 
FROM captacao_radar_oportunidades
WHERE municipio_id = 'seu_uuid'
GROUP BY hash_unico
HAVING COUNT(*) > 1;
```

---

## 🆘 TROUBLESHOOTING PÓS-DEPLOY

### ❌ Cron não está rodando

**Verificar no Vercel:**
- Abrir Vercel Dashboard → Projeto → Settings → Crons
- Verifique se estão listados lá

**Verificar no Linux:**
```bash
# Listar crons ativos
crontab -l

# Verificar se cron está rodando
sudo systemctl status cron

# Ver logs
sudo journalctl -u cron -n 50
```

### ❌ API retorna erro 500

```bash
# Verificar logs do servidor
tail -f /var/log/next.log  # ou seu file de logs

# Testar localmente
npm run dev
curl -X POST http://localhost:3000/api/projetos-captacao/radar/atualizar \
  -H "Authorization: Bearer seu_token"
```

### ❌ Nenhuma oportunidade foi salva

1. Verificar se MUNICIPIO_MINEIROS_ID está correto:
```sql
SELECT id, nome FROM municipios WHERE id = 'seu_uuid_aqui';
```

2. Testar coleta manualmente e ver logs
3. Verificar se função SQL `calcular_score_oportunidade()` existe:
```sql
SELECT * FROM pg_proc WHERE proname = 'calcular_score_oportunidade';
```

### ❌ UI não carrega

1. Verificar console do navegador (F12)
2. Verificar se page-new.tsx foi renomeado para page.tsx
3. Verificar se RLS não está bloqueando acesso:
```sql
SELECT * FROM captacao_radar_oportunidades 
LIMIT 1;
-- Se retorna vazio, há problema com RLS
```

---

## ✨ PRONTO!

Após confirmar todos os itens do checklist, seu sistema Radar estará 100% funcional! 🎉

**Status atual:** ✅ CÓDIGO PRONTO → PRÓXIMO: Deploy
