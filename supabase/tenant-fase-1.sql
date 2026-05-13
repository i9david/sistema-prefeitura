create extension if not exists pgcrypto;

create table if not exists public.municipios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  uf text,
  cnpj text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usuario_municipios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.administrativo_usuarios(id) on delete cascade,
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  papel text not null default 'operador',
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, municipio_id)
);

create index if not exists usuario_municipios_usuario_id_idx
  on public.usuario_municipios(usuario_id);

create index if not exists usuario_municipios_municipio_id_idx
  on public.usuario_municipios(municipio_id);

insert into public.municipios (nome, slug, status)
values ('Município padrão', 'municipio-padrao', 'ativo')
on conflict (slug) do nothing;

insert into public.usuario_municipios (usuario_id, municipio_id, papel, status)
select
  u.id,
  m.id,
  case
    when coalesce(u.perfil, u.nivel) = 'admin' then 'admin_municipal'
    else 'operador'
  end,
  'ativo'
from public.administrativo_usuarios u
cross join public.municipios m
where m.slug = 'municipio-padrao'
on conflict (usuario_id, municipio_id) do nothing;

do $$
declare
  tabela text;
  tabelas text[] := array[
    'pessoas',
    'alunos',
    'professores',
    'modalidades',
    'aulas',
    'aula_professores',
    'modalidade_professores',
    'frequencias',
    'aluno_biometrias',
    'visitantes',
    'biblioteca_leitores',
    'biblioteca_emprestimos',
    'museu_visitantes',
    'museu_categorias',
    'museu_acervo',
    'museu_movimentacoes',
    'casa_artesao_artesaos',
    'casa_artesao_produtos',
    'casa_artesao_estoque_movimentacoes',
    'casa_artesao_vendas',
    'casa_artesao_venda_itens',
    'casa_artesao_fechamentos',
    'casa_artesao_configuracoes',
    'banda_municipal_musicos',
    'banda_municipal_instrumentos',
    'banda_municipal_ensaios',
    'banda_municipal_ensaio_presencas',
    'banda_municipal_apresentacoes',
    'banda_municipal_apresentacao_participantes',
    'banda_municipal_apresentacao_musicos',
    'turismo_pontos',
    'turismo_demandas',
    'turismo_visitantes',
    'captacao_fontes',
    'captacao_oportunidades',
    'captacao_projetos',
    'captacao_analises',
    'captacao_matching',
    'captacao_ia_historico',
    'captacao_radar_fontes',
    'captacao_radar_capturas',
    'administrativo_configuracoes',
    'comunicacoes',
    'administrativo_logs',
    'auditoria_logs'
  ];
begin
  foreach tabela in array tabelas loop
    if to_regclass('public.' || tabela) is not null then
      execute format(
        'alter table public.%I add column if not exists municipio_id uuid references public.municipios(id) on delete restrict',
        tabela
      );

      execute format(
        'create index if not exists %I on public.%I(municipio_id)',
        tabela || '_municipio_id_idx',
        tabela
      );
    end if;
  end loop;
end $$;

do $$
declare
  municipio_padrao_id uuid;
  tabela text;
  tabelas text[] := array[
    'pessoas',
    'alunos',
    'professores',
    'modalidades',
    'aulas',
    'aula_professores',
    'modalidade_professores',
    'frequencias',
    'aluno_biometrias',
    'visitantes',
    'biblioteca_leitores',
    'biblioteca_emprestimos',
    'museu_visitantes',
    'museu_categorias',
    'museu_acervo',
    'museu_movimentacoes',
    'casa_artesao_artesaos',
    'casa_artesao_produtos',
    'casa_artesao_estoque_movimentacoes',
    'casa_artesao_vendas',
    'casa_artesao_venda_itens',
    'casa_artesao_fechamentos',
    'casa_artesao_configuracoes',
    'banda_municipal_musicos',
    'banda_municipal_instrumentos',
    'banda_municipal_ensaios',
    'banda_municipal_ensaio_presencas',
    'banda_municipal_apresentacoes',
    'banda_municipal_apresentacao_participantes',
    'banda_municipal_apresentacao_musicos',
    'turismo_pontos',
    'turismo_demandas',
    'turismo_visitantes',
    'captacao_fontes',
    'captacao_oportunidades',
    'captacao_projetos',
    'captacao_analises',
    'captacao_matching',
    'captacao_ia_historico',
    'captacao_radar_fontes',
    'captacao_radar_capturas',
    'administrativo_configuracoes',
    'comunicacoes',
    'administrativo_logs',
    'auditoria_logs'
  ];
begin
  select id into municipio_padrao_id
  from public.municipios
  where slug = 'municipio-padrao';

  if municipio_padrao_id is null then
    return;
  end if;

  foreach tabela in array tabelas loop
    if to_regclass('public.' || tabela) is not null then
      execute format(
        'update public.%I set municipio_id = $1 where municipio_id is null',
        tabela
      )
      using municipio_padrao_id;
    end if;
  end loop;
end $$;
