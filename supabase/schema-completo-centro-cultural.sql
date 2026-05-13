-- ============================================================================
-- SCHEMA COMPLETO E IDEMPOTENTE - CENTRO CULTURAL (Mineiros)
-- Gerado a partir da análise de 53 tabelas referenciadas no código
-- Data: 2024
-- ============================================================================

-- Dependência: municipios e tenant foundation já devem existir
-- Referência: tenant-fase-1.sql, single-tenant-mineiros.sql

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PESSOAS BASE
-- ============================================================================

create table if not exists public.pessoas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('fisica', 'juridica')),
  documento text,
  data_nascimento date,
  email text,
  telefone text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pessoas_municipio_documento_unique unique(municipio_id, documento)
);

create index if not exists pessoas_municipio_idx on public.pessoas(municipio_id);
create index if not exists pessoas_nome_idx on public.pessoas(municipio_id, nome);
create index if not exists pessoas_status_idx on public.pessoas(municipio_id, status);
create index if not exists pessoas_documento_idx on public.pessoas(municipio_id, documento);

-- ============================================================================
-- ADMINISTRATIVO
-- ============================================================================

create table if not exists public.administrativo_usuarios (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  nome text not null,
  email text not null,
  cargo text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint administrativo_usuarios_municipio_email_unique unique(municipio_id, email)
);

create index if not exists administrativo_usuarios_municipio_idx on public.administrativo_usuarios(municipio_id);
create index if not exists administrativo_usuarios_usuario_id_idx on public.administrativo_usuarios(usuario_id);

create table if not exists public.administrativo_permissoes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  usuario_id uuid not null references public.administrativo_usuarios(id) on delete cascade,
  modulo text not null,
  acao text not null,
  criado_em timestamptz not null default now(),
  constraint administrativo_permissoes_usuario_modulo_acao_unique unique(municipio_id, usuario_id, modulo, acao)
);

create index if not exists administrativo_permissoes_municipio_idx on public.administrativo_permissoes(municipio_id);
create index if not exists administrativo_permissoes_usuario_idx on public.administrativo_permissoes(usuario_id);

create table if not exists public.administrativo_acessos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  modulo text,
  pagina text,
  acao text,
  data_acesso timestamptz not null default now(),
  ip_address text,
  user_agent text,
  resultado text
);

create index if not exists administrativo_acessos_municipio_data_idx on public.administrativo_acessos(municipio_id, data_acesso desc);
create index if not exists administrativo_acessos_usuario_idx on public.administrativo_acessos(usuario_id);

create table if not exists public.administrativo_configuracoes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  chave text not null,
  valor text,
  tipo text default 'texto',
  descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint administrativo_configuracoes_municipio_chave_unique unique(municipio_id, chave)
);

create index if not exists administrativo_configuracoes_municipio_idx on public.administrativo_configuracoes(municipio_id);

-- ============================================================================
-- AULAS E MODALIDADES
-- ============================================================================

create table if not exists public.modalidades (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  descricao text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modalidades_municipio_nome_unique unique(municipio_id, nome)
);

create index if not exists modalidades_municipio_idx on public.modalidades(municipio_id);
create index if not exists modalidades_status_idx on public.modalidades(municipio_id, status);

create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  modalidade_id uuid not null references public.modalidades(id) on delete restrict,
  nome text not null,
  descricao text,
  horario_inicio time,
  horario_fim time,
  dia_semana text,
  local text,
  professor_id uuid references public.pessoas(id) on delete set null,
  vagas_disponiveis integer default 0,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint aulas_municipio_nome_unique unique(municipio_id, nome)
);

create index if not exists aulas_municipio_idx on public.aulas(municipio_id);
create index if not exists aulas_modalidade_idx on public.aulas(modalidade_id);
create index if not exists aulas_professor_idx on public.aulas(professor_id);
create index if not exists aulas_status_idx on public.aulas(municipio_id, status);

create table if not exists public.professores (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  cpf text,
  data_admissao date,
  especialidade text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'licenca', 'afastado')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professores_municipio_cpf_unique unique(municipio_id, cpf)
);

create index if not exists professores_municipio_idx on public.professores(municipio_id);
create index if not exists professores_pessoa_idx on public.professores(pessoa_id);
create index if not exists professores_status_idx on public.professores(municipio_id, status);

create table if not exists public.aula_professores (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  professor_id uuid not null references public.professores(id) on delete cascade,
  data_inicio date not null,
  data_fim date,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  constraint aula_professores_municipio_aula_professor_unique unique(municipio_id, aula_id, professor_id)
);

create index if not exists aula_professores_municipio_idx on public.aula_professores(municipio_id);
create index if not exists aula_professores_aula_idx on public.aula_professores(aula_id);
create index if not exists aula_professores_professor_idx on public.aula_professores(professor_id);

create table if not exists public.modalidade_professores (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  modalidade_id uuid not null references public.modalidades(id) on delete cascade,
  professor_id uuid not null references public.professores(id) on delete cascade,
  data_inicio date not null,
  data_fim date,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  constraint modalidade_professores_municipio_modalidade_professor_unique unique(municipio_id, modalidade_id, professor_id)
);

create index if not exists modalidade_professores_municipio_idx on public.modalidade_professores(municipio_id);
create index if not exists modalidade_professores_modalidade_idx on public.modalidade_professores(modalidade_id);
create index if not exists modalidade_professores_professor_idx on public.modalidade_professores(professor_id);

-- ============================================================================
-- ALUNOS
-- ============================================================================

create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  pessoa_id uuid references public.pessoas(id) on delete set null,
  aula_id uuid not null references public.aulas(id) on delete restrict,
  nome text not null,
  telefone text,
  data_nascimento date,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  biometria_cadastrada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alunos_municipio_idx on public.alunos(municipio_id);
create index if not exists alunos_pessoa_id_idx on public.alunos(pessoa_id);
create index if not exists alunos_aula_id_idx on public.alunos(aula_id);
create index if not exists alunos_status_idx on public.alunos(municipio_id, status);
create index if not exists alunos_nome_idx on public.alunos(municipio_id, nome);

create table if not exists public.aluno_matriculas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  data_matricula date not null default current_date,
  data_desmatriculacao date,
  motivo_desmatriculacao text,
  status text not null default 'ativa' check (status in ('ativa', 'cancelada', 'concluida')),
  created_at timestamptz not null default now(),
  constraint aluno_matriculas_municipio_aluno_aula_unique unique(municipio_id, aluno_id, aula_id)
);

create index if not exists aluno_matriculas_municipio_idx on public.aluno_matriculas(municipio_id);
create index if not exists aluno_matriculas_aluno_idx on public.aluno_matriculas(aluno_id);
create index if not exists aluno_matriculas_aula_idx on public.aluno_matriculas(aula_id);
create index if not exists aluno_matriculas_status_idx on public.aluno_matriculas(municipio_id, status);

create table if not exists public.aluno_biometrias (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  dados_biometricos bytea,
  tipo_biometria text default 'impressao_digital',
  data_cadastro timestamptz not null default now(),
  ativa boolean not null default true
);

create index if not exists aluno_biometrias_municipio_idx on public.aluno_biometrias(municipio_id);
create index if not exists aluno_biometrias_aluno_idx on public.aluno_biometrias(aluno_id);

create table if not exists public.frequencias (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  data_aula date not null,
  presente boolean not null default false,
  justificativa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint frequencias_municipio_aluno_aula_data_unique unique(municipio_id, aluno_id, aula_id, data_aula)
);

create index if not exists frequencias_municipio_idx on public.frequencias(municipio_id);
create index if not exists frequencias_aluno_idx on public.frequencias(aluno_id);
create index if not exists frequencias_aula_data_idx on public.frequencias(aula_id, data_aula);
create index if not exists frequencias_presente_idx on public.frequencias(municipio_id, presente, data_aula desc);

-- ============================================================================
-- BANDA MUNICIPAL
-- ============================================================================

create table if not exists public.banda_municipal_instrumentos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  descricao text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banda_municipal_instrumentos_municipio_nome_unique unique(municipio_id, nome)
);

create index if not exists banda_municipal_instrumentos_municipio_idx on public.banda_municipal_instrumentos(municipio_id);

create table if not exists public.banda_municipal_musicos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  instrumento_id uuid references public.banda_municipal_instrumentos(id) on delete set null,
  data_admissao date,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'licenca')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banda_municipal_musicos_municipio_pessoa_unique unique(municipio_id, pessoa_id)
);

create index if not exists banda_municipal_musicos_municipio_idx on public.banda_municipal_musicos(municipio_id);
create index if not exists banda_municipal_musicos_pessoa_idx on public.banda_municipal_musicos(pessoa_id);
create index if not exists banda_municipal_musicos_instrumento_idx on public.banda_municipal_musicos(instrumento_id);
create index if not exists banda_municipal_musicos_status_idx on public.banda_municipal_musicos(municipio_id, status);

create table if not exists public.banda_municipal_ensaios (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  data_ensaio date not null,
  horario_inicio time,
  horario_fim time,
  local text,
  tema text,
  responsavel text,
  observacoes text,
  status text not null default 'agendado' check (status in ('agendado', 'realizado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banda_municipal_ensaios_municipio_idx on public.banda_municipal_ensaios(municipio_id);
create index if not exists banda_municipal_ensaios_data_idx on public.banda_municipal_ensaios(municipio_id, data_ensaio desc);
create index if not exists banda_municipal_ensaios_status_idx on public.banda_municipal_ensaios(status);

create table if not exists public.banda_municipal_presencas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  ensaio_id uuid not null references public.banda_municipal_ensaios(id) on delete cascade,
  musico_id uuid not null references public.banda_municipal_musicos(id) on delete cascade,
  presente boolean not null default false,
  justificativa text,
  created_at timestamptz not null default now(),
  constraint banda_municipal_presencas_municipio_ensaio_musico_unique unique(municipio_id, ensaio_id, musico_id)
);

create index if not exists banda_municipal_presencas_municipio_idx on public.banda_municipal_presencas(municipio_id);
create index if not exists banda_municipal_presencas_ensaio_idx on public.banda_municipal_presencas(ensaio_id);
create index if not exists banda_municipal_presencas_musico_idx on public.banda_municipal_presencas(musico_id);

create table if not exists public.banda_municipal_ensaio_presencas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  ensaio_id uuid not null references public.banda_municipal_ensaios(id) on delete cascade,
  musico_id uuid not null references public.banda_municipal_musicos(id) on delete cascade,
  presente boolean not null default false,
  justificativa text,
  data_registro timestamptz not null default now(),
  constraint banda_municipal_ensaio_presencas_municipio_ensaio_musico_unique unique(municipio_id, ensaio_id, musico_id)
);

create index if not exists banda_municipal_ensaio_presencas_municipio_idx on public.banda_municipal_ensaio_presencas(municipio_id);
create index if not exists banda_municipal_ensaio_presencas_ensaio_idx on public.banda_municipal_ensaio_presencas(ensaio_id);

create table if not exists public.banda_municipal_apresentacoes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  data_apresentacao date not null,
  horario time,
  local text,
  tema text,
  responsavel text,
  observacoes text,
  status text not null default 'agendada' check (status in ('agendada', 'realizada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banda_municipal_apresentacoes_municipio_idx on public.banda_municipal_apresentacoes(municipio_id);
create index if not exists banda_municipal_apresentacoes_data_idx on public.banda_municipal_apresentacoes(municipio_id, data_apresentacao desc);

create table if not exists public.banda_municipal_apresentacao_musicos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  apresentacao_id uuid not null references public.banda_municipal_apresentacoes(id) on delete cascade,
  musico_id uuid not null references public.banda_municipal_musicos(id) on delete cascade,
  presenca_confirmada boolean default false,
  criado_em timestamptz not null default now(),
  constraint banda_municipal_apresentacao_musicos_municipio_apresentacao_musico_unique unique(municipio_id, apresentacao_id, musico_id)
);

create index if not exists banda_municipal_apresentacao_musicos_municipio_idx on public.banda_municipal_apresentacao_musicos(municipio_id);
create index if not exists banda_municipal_apresentacao_musicos_apresentacao_idx on public.banda_municipal_apresentacao_musicos(apresentacao_id);
create index if not exists banda_municipal_apresentacao_musicos_musico_idx on public.banda_municipal_apresentacao_musicos(musico_id);

-- ============================================================================
-- ALMOXARIFADO (already in almoxarifado.sql, included for completeness)
-- ============================================================================

-- Tables almoxarifado_categorias, almoxarifado_produtos, almoxarifado_movimentacoes
-- are defined in supabase/almoxarifado.sql

-- ============================================================================
-- AGENDA CULTURAL
-- ============================================================================

-- Table agenda_eventos is already defined in supabase/agenda-cultural.sql

-- ============================================================================
-- CASA ARTESÃO
-- ============================================================================

create table if not exists public.casa_artesao_artesaos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  telefone text,
  chave_pix text,
  tipo_chave_pix text,
  observacoes text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint casa_artesao_artesaos_municipio_nome_unique unique(municipio_id, nome)
);

create index if not exists casa_artesao_artesaos_municipio_idx on public.casa_artesao_artesaos(municipio_id);
create index if not exists casa_artesao_artesaos_status_idx on public.casa_artesao_artesaos(municipio_id, status);

create table if not exists public.casa_artesao_produtos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  artesao_id uuid not null references public.casa_artesao_artesaos(id) on delete cascade,
  nome text not null,
  descricao text,
  preco numeric(10, 2) not null,
  quantidade integer default 0,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists casa_artesao_produtos_municipio_idx on public.casa_artesao_produtos(municipio_id);
create index if not exists casa_artesao_produtos_artesao_idx on public.casa_artesao_produtos(artesao_id);
create index if not exists casa_artesao_produtos_status_idx on public.casa_artesao_produtos(municipio_id, status);

create table if not exists public.casa_artesao_vendas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  data_venda date not null,
  cliente_nome text,
  cliente_telefone text,
  cliente_email text,
  total_bruto numeric(10, 2) default 0,
  total_desconto numeric(10, 2) default 0,
  total_liquido numeric(10, 2) default 0,
  forma_pagamento text,
  observacoes text,
  status text not null default 'pendente' check (status in ('pendente', 'confirmada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists casa_artesao_vendas_municipio_idx on public.casa_artesao_vendas(municipio_id);
create index if not exists casa_artesao_vendas_data_idx on public.casa_artesao_vendas(municipio_id, data_venda desc);
create index if not exists casa_artesao_vendas_status_idx on public.casa_artesao_vendas(status);

create table if not exists public.casa_artesao_venda_itens (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  venda_id uuid not null references public.casa_artesao_vendas(id) on delete cascade,
  produto_id uuid not null references public.casa_artesao_produtos(id) on delete restrict,
  artesao_id uuid not null references public.casa_artesao_artesaos(id) on delete restrict,
  quantidade integer not null default 1,
  preco_unitario numeric(10, 2) not null,
  subtotal numeric(10, 2) not null,
  percentual_comissao numeric(5, 2) default 0,
  comissao_valor numeric(10, 2) default 0,
  valor_repasse numeric(10, 2) default 0,
  created_at timestamptz not null default now()
);

create index if not exists casa_artesao_venda_itens_municipio_idx on public.casa_artesao_venda_itens(municipio_id);
create index if not exists casa_artesao_venda_itens_venda_idx on public.casa_artesao_venda_itens(venda_id);
create index if not exists casa_artesao_venda_itens_artesao_idx on public.casa_artesao_venda_itens(artesao_id);
create index if not exists casa_artesao_venda_itens_produto_idx on public.casa_artesao_venda_itens(produto_id);

create table if not exists public.casa_artesao_fechamentos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  artesao_id uuid not null references public.casa_artesao_artesaos(id) on delete cascade,
  competencia text not null,
  data_inicio date,
  data_fim date,
  total_bruto numeric(10, 2) default 0,
  total_comissao numeric(10, 2) default 0,
  total_repasse numeric(10, 2) default 0,
  status text not null default 'aberto' check (status in ('aberto', 'fechado', 'pago')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint casa_artesao_fechamentos_municipio_artesao_competencia_unique unique(municipio_id, artesao_id, competencia)
);

create index if not exists casa_artesao_fechamentos_municipio_idx on public.casa_artesao_fechamentos(municipio_id);
create index if not exists casa_artesao_fechamentos_artesao_idx on public.casa_artesao_fechamentos(artesao_id);
create index if not exists casa_artesao_fechamentos_status_idx on public.casa_artesao_fechamentos(municipio_id, status);
create index if not exists casa_artesao_fechamentos_competencia_idx on public.casa_artesao_fechamentos(municipio_id, competencia desc);

create table if not exists public.casa_artesao_estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  produto_id uuid not null references public.casa_artesao_produtos(id) on delete restrict,
  tipo text not null check (tipo in ('entrada', 'saida', 'devolucao', 'ajuste')),
  quantidade integer not null,
  motivo text,
  responsavel text,
  criado_em timestamptz not null default now()
);

create index if not exists casa_artesao_estoque_movimentacoes_municipio_idx on public.casa_artesao_estoque_movimentacoes(municipio_id);
create index if not exists casa_artesao_estoque_movimentacoes_produto_idx on public.casa_artesao_estoque_movimentacoes(produto_id);
create index if not exists casa_artesao_estoque_movimentacoes_tipo_idx on public.casa_artesao_estoque_movimentacoes(municipio_id, tipo, criado_em desc);

create table if not exists public.casa_artesao_configuracoes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  chave text not null,
  valor text,
  descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint casa_artesao_configuracoes_municipio_chave_unique unique(municipio_id, chave)
);

create index if not exists casa_artesao_configuracoes_municipio_idx on public.casa_artesao_configuracoes(municipio_id);

-- ============================================================================
-- TURISMO
-- ============================================================================

create table if not exists public.turismo_pontos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  tipo text,
  descricao text,
  endereco text,
  localizacao_google text,
  contato_responsavel text,
  telefone_responsavel text,
  observacoes text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint turismo_pontos_municipio_nome_unique unique(municipio_id, nome)
);

create index if not exists turismo_pontos_municipio_idx on public.turismo_pontos(municipio_id);
create index if not exists turismo_pontos_status_idx on public.turismo_pontos(municipio_id, status);

create table if not exists public.turismo_visitantes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  telefone text,
  cidade_origem text,
  ponto_visitado text,
  data_visita date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists turismo_visitantes_municipio_idx on public.turismo_visitantes(municipio_id);
create index if not exists turismo_visitantes_data_visita_idx on public.turismo_visitantes(municipio_id, data_visita desc);

create table if not exists public.turismo_demandas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  ponto_id uuid references public.turismo_pontos(id) on delete set null,
  titulo text not null,
  descricao text,
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida')),
  responsavel text,
  prazo date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists turismo_demandas_municipio_idx on public.turismo_demandas(municipio_id);
create index if not exists turismo_demandas_ponto_idx on public.turismo_demandas(ponto_id);
create index if not exists turismo_demandas_status_idx on public.turismo_demandas(municipio_id, status);
create index if not exists turismo_demandas_prioridade_idx on public.turismo_demandas(municipio_id, prioridade);

-- ============================================================================
-- MUSEU
-- ============================================================================

create table if not exists public.museu_categorias (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  descricao text,
  status text not null default 'ativa' check (status in ('ativa', 'inativa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint museu_categorias_municipio_nome_unique unique(municipio_id, nome)
);

create index if not exists museu_categorias_municipio_idx on public.museu_categorias(municipio_id);
create index if not exists museu_categorias_status_idx on public.museu_categorias(municipio_id, status);

create table if not exists public.museu_acervo (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  categoria_id uuid references public.museu_categorias(id) on delete set null,
  titulo text not null,
  descricao text,
  autor text,
  ano_criacao year,
  material text,
  dimensoes text,
  localizacao_atual text,
  localizacao text,
  status_operacional text not null default 'em_exposicao' check (status_operacional in ('em_exposicao', 'em_reserva', 'em_manutencao', 'em_restauracao', 'emprestada', 'indisponivel')),
  numero_inventario text unique,
  data_aquisicao date,
  valor_aquisicao numeric(10, 2),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists museu_acervo_municipio_idx on public.museu_acervo(municipio_id);
create index if not exists museu_acervo_categoria_idx on public.museu_acervo(categoria_id);
create index if not exists museu_acervo_status_operacional_idx on public.museu_acervo(municipio_id, status_operacional);
create index if not exists museu_acervo_numero_inventario_idx on public.museu_acervo(numero_inventario);

create table if not exists public.museu_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  acervo_id uuid not null references public.museu_acervo(id) on delete cascade,
  tipo text not null,
  descricao text,
  data_movimentacao date not null,
  responsavel text,
  nova_localizacao text,
  novo_status_operacional text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists museu_movimentacoes_municipio_idx on public.museu_movimentacoes(municipio_id);
create index if not exists museu_movimentacoes_acervo_idx on public.museu_movimentacoes(acervo_id);
create index if not exists museu_movimentacoes_data_idx on public.museu_movimentacoes(municipio_id, data_movimentacao desc);

create table if not exists public.museu_visitantes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  cidade_origem text,
  data_visita date not null default current_date,
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists museu_visitantes_municipio_idx on public.museu_visitantes(municipio_id);
create index if not exists museu_visitantes_data_visita_idx on public.museu_visitantes(municipio_id, data_visita desc);

-- ============================================================================
-- BIBLIOTECA
-- ============================================================================

create table if not exists public.biblioteca_leitores (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  numero_registro text unique,
  data_cadastro date not null default current_date,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'suspenso')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblioteca_leitores_municipio_pessoa_unique unique(municipio_id, pessoa_id)
);

create index if not exists biblioteca_leitores_municipio_idx on public.biblioteca_leitores(municipio_id);
create index if not exists biblioteca_leitores_pessoa_idx on public.biblioteca_leitores(pessoa_id);
create index if not exists biblioteca_leitores_status_idx on public.biblioteca_leitores(municipio_id, status);

create table if not exists public.biblioteca_emprestimos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  leitor_id uuid not null references public.biblioteca_leitores(id) on delete restrict,
  recurso_titulo text not null,
  tipo_recurso text not null,
  data_emprestimo date not null default current_date,
  data_devolucao_prevista date not null,
  data_devolucao_real date,
  status text not null default 'ativo' check (status in ('ativo', 'devolvido', 'perdido')),
  multa_valor numeric(10, 2),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists biblioteca_emprestimos_municipio_idx on public.biblioteca_emprestimos(municipio_id);
create index if not exists biblioteca_emprestimos_leitor_idx on public.biblioteca_emprestimos(leitor_id);
create index if not exists biblioteca_emprestimos_status_idx on public.biblioteca_emprestimos(municipio_id, status);
create index if not exists biblioteca_emprestimos_datas_idx on public.biblioteca_emprestimos(municipio_id, data_emprestimo desc, data_devolucao_real);

-- ============================================================================
-- VISITANTES (CRM)
-- ============================================================================

create table if not exists public.visitantes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  pessoa_id uuid references public.pessoas(id) on delete set null,
  nome text not null,
  email text,
  telefone text,
  cidade_origem text,
  tipo_visitante text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  primeira_visita date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visitantes_municipio_idx on public.visitantes(municipio_id);
create index if not exists visitantes_pessoa_idx on public.visitantes(pessoa_id);
create index if not exists visitantes_email_idx on public.visitantes(municipio_id, email);
create index if not exists visitantes_status_idx on public.visitantes(municipio_id, status);

create table if not exists public.visitante_visitas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  visitante_id uuid not null references public.visitantes(id) on delete cascade,
  data_visita date not null default current_date,
  local_visita text,
  motivo_visita text,
  duracoes_minutos integer,
  avaliacao integer,
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists visitante_visitas_municipio_idx on public.visitante_visitas(municipio_id);
create index if not exists visitante_visitas_visitante_idx on public.visitante_visitas(visitante_id);
create index if not exists visitante_visitas_data_idx on public.visitante_visitas(municipio_id, data_visita desc);

-- ============================================================================
-- CAPTAÇÃO (FUNDRAISING)
-- ============================================================================

create table if not exists public.captacao_fontes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('pessoa_fisica', 'pessoa_juridica', 'governo', 'fundacao', 'outro')),
  contato_nome text,
  contato_email text,
  contato_telefone text,
  documento text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'prospects')),
  potencial_anual numeric(12, 2),
  historico_donativos numeric(12, 2),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint captacao_fontes_municipio_documento_unique unique(municipio_id, documento)
);

create index if not exists captacao_fontes_municipio_idx on public.captacao_fontes(municipio_id);
create index if not exists captacao_fontes_tipo_idx on public.captacao_fontes(municipio_id, tipo);
create index if not exists captacao_fontes_status_idx on public.captacao_fontes(municipio_id, status);

create table if not exists public.captacao_oportunidades (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  fonte_id uuid not null references public.captacao_fontes(id) on delete cascade,
  titulo text not null,
  descricao text,
  tipo text not null,
  valor_potencial numeric(12, 2),
  data_proxima_acao date,
  responsavel text,
  probabilidade_fechamento integer,
  status text not null default 'prospeccao' check (status in ('prospeccao', 'negociacao', 'ganho', 'perdido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists captacao_oportunidades_municipio_idx on public.captacao_oportunidades(municipio_id);
create index if not exists captacao_oportunidades_fonte_idx on public.captacao_oportunidades(fonte_id);
create index if not exists captacao_oportunidades_status_idx on public.captacao_oportunidades(municipio_id, status);
create index if not exists captacao_oportunidades_data_idx on public.captacao_oportunidades(municipio_id, data_proxima_acao);

create table if not exists public.captacao_projetos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  titulo text not null,
  descricao text,
  orcamento numeric(12, 2),
  valor_captado numeric(12, 2) default 0,
  percentual_realizado numeric(5, 2) default 0,
  data_inicio date,
  data_fim date,
  responsavel text,
  status text not null default 'planejamento' check (status in ('planejamento', 'execucao', 'concluido', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint captacao_projetos_municipio_titulo_unique unique(municipio_id, titulo)
);

create index if not exists captacao_projetos_municipio_idx on public.captacao_projetos(municipio_id);
create index if not exists captacao_projetos_status_idx on public.captacao_projetos(municipio_id, status);
create index if not exists captacao_projetos_data_idx on public.captacao_projetos(municipio_id, data_inicio, data_fim);

create table if not exists public.captacao_analises (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  tipo_analise text not null,
  dados_analise jsonb,
  conclusoes text,
  data_geracao timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null
);

create index if not exists captacao_analises_municipio_idx on public.captacao_analises(municipio_id);
create index if not exists captacao_analises_data_idx on public.captacao_analises(municipio_id, data_geracao desc);

-- RADAR AVANÇADO (Tables from captacao-radar-avancado.sql if needed)

create table if not exists public.captacao_radar_fontes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  descricao text,
  categoria text,
  website text,
  acao_recomendada text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists captacao_radar_fontes_municipio_idx on public.captacao_radar_fontes(municipio_id);

create table if not exists public.captacao_radar_oportunidades (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  fonte_id uuid references public.captacao_radar_fontes(id) on delete set null,
  titulo text not null,
  descricao text,
  valor_estimado numeric(12, 2),
  deadline date,
  status text not null default 'descoberta' check (status in ('descoberta', 'qualificada', 'descartada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists captacao_radar_oportunidades_municipio_idx on public.captacao_radar_oportunidades(municipio_id);
create index if not exists captacao_radar_oportunidades_fonte_idx on public.captacao_radar_oportunidades(fonte_id);

create table if not exists public.captacao_radar_capturas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  oportunidade_id uuid references public.captacao_radar_oportunidades(id) on delete set null,
  tipo_captura text not null,
  dados jsonb,
  data_captura timestamptz not null default now()
);

create index if not exists captacao_radar_capturas_municipio_idx on public.captacao_radar_capturas(municipio_id);
create index if not exists captacao_radar_capturas_oportunidade_idx on public.captacao_radar_capturas(oportunidade_id);

create table if not exists public.captacao_radar_historico_score (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  oportunidade_id uuid not null references public.captacao_radar_oportunidades(id) on delete cascade,
  score_anterior numeric(5, 2),
  score_novo numeric(5, 2),
  motivo_mudanca text,
  data_atualizacao timestamptz not null default now()
);

create index if not exists captacao_radar_historico_score_municipio_idx on public.captacao_radar_historico_score(municipio_id);
create index if not exists captacao_radar_historico_score_oportunidade_idx on public.captacao_radar_historico_score(oportunidade_id);

create table if not exists public.captacao_ia_historico (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  tipo_analise text not null,
  entrada text,
  resultado text,
  modelo_ia text,
  data_processamento timestamptz not null default now()
);

create index if not exists captacao_ia_historico_municipio_idx on public.captacao_ia_historico(municipio_id);
create index if not exists captacao_ia_historico_data_idx on public.captacao_ia_historico(municipio_id, data_processamento desc);

create table if not exists public.captacao_radar_historico (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  evento_tipo text not null,
  descricao text,
  dados jsonb,
  data_evento timestamptz not null default now()
);

create index if not exists captacao_radar_historico_municipio_idx on public.captacao_radar_historico(municipio_id);
create index if not exists captacao_radar_historico_data_idx on public.captacao_radar_historico(municipio_id, data_evento desc);

create table if not exists public.captacao_matching (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  fonte_id uuid references public.captacao_fontes(id) on delete set null,
  oportunidade_id uuid references public.captacao_oportunidades(id) on delete set null,
  score_match numeric(5, 2),
  motivo_match text,
  data_matching timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists captacao_matching_municipio_idx on public.captacao_matching(municipio_id);
create index if not exists captacao_matching_fonte_idx on public.captacao_matching(fonte_id);
create index if not exists captacao_matching_oportunidade_idx on public.captacao_matching(oportunidade_id);

-- ============================================================================
-- COMUNICAÇÕES
-- ============================================================================

create table if not exists public.comunicacoes (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  destinatario_nome text,
  destinatario_email text,
  destinatario_telefone text,
  assunto text,
  corpo text,
  tipo text not null check (tipo in ('email', 'sms', 'whatsapp', 'notificacao')),
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'entregue', 'falha')),
  data_envio timestamptz,
  data_leitura timestamptz,
  erro_mensagem text,
  created_at timestamptz not null default now()
);

create index if not exists comunicacoes_municipio_idx on public.comunicacoes(municipio_id);
create index if not exists comunicacoes_status_idx on public.comunicacoes(municipio_id, status);
create index if not exists comunicacoes_data_idx on public.comunicacoes(municipio_id, created_at desc);
create index if not exists comunicacoes_tipo_idx on public.comunicacoes(tipo);

-- ============================================================================
-- TRIGGERS e FUNCIONALIDADES ADICIONAIS
-- ============================================================================

-- Trigger para atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Aplicar trigger onde necessário
drop trigger if exists set_pessoas_updated_at on public.pessoas;
create trigger set_pessoas_updated_at before update on public.pessoas
for each row execute function public.set_updated_at();

drop trigger if exists set_modalidades_updated_at on public.modalidades;
create trigger set_modalidades_updated_at before update on public.modalidades
for each row execute function public.set_updated_at();

drop trigger if exists set_aulas_updated_at on public.aulas;
create trigger set_aulas_updated_at before update on public.aulas
for each row execute function public.set_updated_at();

drop trigger if exists set_professores_updated_at on public.professores;
create trigger set_professores_updated_at before update on public.professores
for each row execute function public.set_updated_at();

drop trigger if exists set_alunos_updated_at on public.alunos;
create trigger set_alunos_updated_at before update on public.alunos
for each row execute function public.set_updated_at();

drop trigger if exists set_frequencias_updated_at on public.frequencias;
create trigger set_frequencias_updated_at before update on public.frequencias
for each row execute function public.set_updated_at();

drop trigger if exists set_banda_municipal_musicos_updated_at on public.banda_municipal_musicos;
create trigger set_banda_municipal_musicos_updated_at before update on public.banda_municipal_musicos
for each row execute function public.set_updated_at();

drop trigger if exists set_banda_municipal_ensaios_updated_at on public.banda_municipal_ensaios;
create trigger set_banda_municipal_ensaios_updated_at before update on public.banda_municipal_ensaios
for each row execute function public.set_updated_at();

drop trigger if exists set_casa_artesao_artesaos_updated_at on public.casa_artesao_artesaos;
create trigger set_casa_artesao_artesaos_updated_at before update on public.casa_artesao_artesaos
for each row execute function public.set_updated_at();

drop trigger if exists set_casa_artesao_produtos_updated_at on public.casa_artesao_produtos;
create trigger set_casa_artesao_produtos_updated_at before update on public.casa_artesao_produtos
for each row execute function public.set_updated_at();

drop trigger if exists set_casa_artesao_vendas_updated_at on public.casa_artesao_vendas;
create trigger set_casa_artesao_vendas_updated_at before update on public.casa_artesao_vendas
for each row execute function public.set_updated_at();

drop trigger if exists set_turismo_pontos_updated_at on public.turismo_pontos;
create trigger set_turismo_pontos_updated_at before update on public.turismo_pontos
for each row execute function public.set_updated_at();

drop trigger if exists set_turismo_visitantes_updated_at on public.turismo_visitantes;
create trigger set_turismo_visitantes_updated_at before update on public.turismo_visitantes
for each row execute function public.set_updated_at();

drop trigger if exists set_turismo_demandas_updated_at on public.turismo_demandas;
create trigger set_turismo_demandas_updated_at before update on public.turismo_demandas
for each row execute function public.set_updated_at();

drop trigger if exists set_museu_categorias_updated_at on public.museu_categorias;
create trigger set_museu_categorias_updated_at before update on public.museu_categorias
for each row execute function public.set_updated_at();

drop trigger if exists set_museu_acervo_updated_at on public.museu_acervo;
create trigger set_museu_acervo_updated_at before update on public.museu_acervo
for each row execute function public.set_updated_at();

drop trigger if exists set_museu_movimentacoes_updated_at on public.museu_movimentacoes;
create trigger set_museu_movimentacoes_updated_at before update on public.museu_movimentacoes
for each row execute function public.set_updated_at();

drop trigger if exists set_visitantes_updated_at on public.visitantes;
create trigger set_visitantes_updated_at before update on public.visitantes
for each row execute function public.set_updated_at();

drop trigger if exists set_administrativo_usuarios_updated_at on public.administrativo_usuarios;
create trigger set_administrativo_usuarios_updated_at before update on public.administrativo_usuarios
for each row execute function public.set_updated_at();

drop trigger if exists set_biblioteca_leitores_updated_at on public.biblioteca_leitores;
create trigger set_biblioteca_leitores_updated_at before update on public.biblioteca_leitores
for each row execute function public.set_updated_at();

drop trigger if exists set_biblioteca_emprestimos_updated_at on public.biblioteca_emprestimos;
create trigger set_biblioteca_emprestimos_updated_at before update on public.biblioteca_emprestimos
for each row execute function public.set_updated_at();

drop trigger if exists set_captacao_fontes_updated_at on public.captacao_fontes;
create trigger set_captacao_fontes_updated_at before update on public.captacao_fontes
for each row execute function public.set_updated_at();

drop trigger if exists set_captacao_oportunidades_updated_at on public.captacao_oportunidades;
create trigger set_captacao_oportunidades_updated_at before update on public.captacao_oportunidades
for each row execute function public.set_updated_at();

drop trigger if exists set_captacao_projetos_updated_at on public.captacao_projetos;
create trigger set_captacao_projetos_updated_at before update on public.captacao_projetos
for each row execute function public.set_updated_at();

drop trigger if exists set_captacao_radar_fontes_updated_at on public.captacao_radar_fontes;
create trigger set_captacao_radar_fontes_updated_at before update on public.captacao_radar_fontes
for each row execute function public.set_updated_at();

drop trigger if exists set_captacao_radar_oportunidades_updated_at on public.captacao_radar_oportunidades;
create trigger set_captacao_radar_oportunidades_updated_at before update on public.captacao_radar_oportunidades
for each row execute function public.set_updated_at();

drop trigger if exists set_captacao_matching_updated_at on public.captacao_matching;
create trigger set_captacao_matching_updated_at before update on public.captacao_matching
for each row execute function public.set_updated_at();
