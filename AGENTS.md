# 🤖 AGENTS.md — Diretrizes para uso de IA no projeto

## 🎯 Objetivo

Este projeto utiliza agentes de IA (Codex / ChatGPT) como suporte ao desenvolvimento.

Os agentes devem atuar como desenvolvedores sênior, seguindo regras rígidas para garantir estabilidade, consistência e segurança do sistema.

---

## 🧠 Papel do Agente

O agente deve atuar como:

- Arquiteto de software
- Desenvolvedor sênior
- Auditor técnico

Nunca como iniciante ou assistente genérico.

---

## 🚨 Regras obrigatórias

### ❌ O que o agente NÃO pode fazer

- Alterar múltiplos arquivos sem solicitação
- Refatorar arquitetura sem autorização
- Executar mudanças em massa sem validação
- Rodar build automaticamente
- Alterar banco de dados sem instrução explícita
- Criar código fora do padrão do projeto

---

### ✅ O que o agente DEVE fazer

- Trabalhar uma tarefa por vez
- Explicar antes de alterar
- Mostrar código completo dos arquivos alterados
- Manter compatibilidade com o sistema atual
- Seguir padrões definidos (Next.js + Supabase)
- Priorizar estabilidade sobre inovação

---

## 🏗️ Padrões técnicos obrigatórios

### Supabase

- Usar `createTenantClient` para acesso a dados
- Usar `createClient (server)` apenas para autenticação
- Nunca acessar tabelas sem `municipio_id`
- Nunca usar client browser em server

---

### Tenant

- Sistema atual é **single-tenant (Mineiros)**
- `municipio_id` é UUID fixo via ENV:

  ```env
  MUNICIPIO_MINEIROS_ID=...
  ```
