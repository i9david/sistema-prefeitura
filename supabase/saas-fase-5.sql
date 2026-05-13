create extension if not exists pgcrypto;

create table if not exists public.saas_planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  descricao text,
  preco_centavos integer not null default 0,
  moeda text not null default 'BRL',
  limite_usuarios integer,
  limite_modulos integer,
  recursos jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.municipio_assinaturas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  plano_id uuid not null references public.saas_planos(id) on delete restrict,
  status text not null default 'ativa' check (
    status in ('trial', 'ativa', 'past_due', 'cancelada', 'suspensa')
  ),
  periodo_teste_ate timestamptz,
  inicio_em timestamptz not null default now(),
  fim_em timestamptz,
  billing_provider text,
  billing_customer_id text,
  billing_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_modulos (
  modulo text primary key,
  nome text not null,
  descricao text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.municipio_modulos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  modulo text not null references public.saas_modulos(modulo) on delete restrict,
  ativo boolean not null default true,
  ativado_em timestamptz not null default now(),
  desativado_em timestamptz,
  unique (municipio_id, modulo)
);

create table if not exists public.saas_billing_eventos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid references public.municipios(id) on delete set null,
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processado_em timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists municipio_assinaturas_municipio_id_idx
  on public.municipio_assinaturas(municipio_id);

create index if not exists municipio_assinaturas_status_idx
  on public.municipio_assinaturas(status);

create index if not exists municipio_modulos_municipio_id_idx
  on public.municipio_modulos(municipio_id);

create index if not exists saas_billing_eventos_municipio_id_idx
  on public.saas_billing_eventos(municipio_id);

insert into public.saas_planos (
  nome,
  slug,
  descricao,
  preco_centavos,
  limite_usuarios,
  limite_modulos,
  recursos
)
values
  (
    'Essencial',
    'essencial',
    'Plano inicial para municípios pequenos.',
    0,
    5,
    3,
    '{"billing_ready": true}'::jsonb
  ),
  (
    'Profissional',
    'profissional',
    'Plano completo para secretarias municipais.',
    0,
    25,
    7,
    '{"billing_ready": true}'::jsonb
  ),
  (
    'Enterprise',
    'enterprise',
    'Plano sem limites operacionais definidos.',
    0,
    null,
    null,
    '{"billing_ready": true}'::jsonb
  )
on conflict (slug) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  limite_usuarios = excluded.limite_usuarios,
  limite_modulos = excluded.limite_modulos,
  recursos = excluded.recursos,
  updated_at = now();

insert into public.saas_modulos (modulo, nome, descricao, ordem)
values
  ('centro-cultural', 'Centro Cultural', 'Alunos, aulas, professores, frequência e visitantes.', 10),
  ('museu', 'Museu', 'Acervo, categorias, movimentações e visitantes do museu.', 20),
  ('casa-artesao', 'Casa do Artesão', 'Artesãos, produtos, estoque, caixa e relatórios.', 30),
  ('banda-municipal', 'Banda Municipal', 'Músicos, instrumentos, ensaios e apresentações.', 40),
  ('turismo', 'Turismo', 'Pontos turísticos, demandas, visitantes e relatórios.', 50),
  ('projetos-captacao', 'Projetos e Captação', 'Projetos, fontes, oportunidades, radar e matching.', 60),
  ('administrativo', 'Administrativo', 'Usuários, permissões, configurações e gestão geral.', 70)
on conflict (modulo) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  ordem = excluded.ordem;

insert into public.municipio_assinaturas (municipio_id, plano_id, status)
select m.id, p.id, 'ativa'
from public.municipios m
cross join public.saas_planos p
where m.slug = 'municipio-padrao'
  and p.slug = 'enterprise'
  and not exists (
    select 1
    from public.municipio_assinaturas ma
    where ma.municipio_id = m.id
      and ma.status in ('trial', 'ativa')
  );

insert into public.municipio_modulos (municipio_id, modulo, ativo)
select m.id, sm.modulo, true
from public.municipios m
cross join public.saas_modulos sm
where m.slug = 'municipio-padrao'
on conflict (municipio_id, modulo) do nothing;

alter table public.saas_planos enable row level security;
alter table public.saas_modulos enable row level security;
alter table public.municipio_assinaturas enable row level security;
alter table public.municipio_modulos enable row level security;
alter table public.saas_billing_eventos enable row level security;

drop policy if exists saas_planos_select_authenticated on public.saas_planos;
create policy saas_planos_select_authenticated
on public.saas_planos
for select
to authenticated
using (ativo = true);

drop policy if exists saas_modulos_select_authenticated on public.saas_modulos;
create policy saas_modulos_select_authenticated
on public.saas_modulos
for select
to authenticated
using (ativo = true);

drop policy if exists municipio_assinaturas_select_tenant on public.municipio_assinaturas;
create policy municipio_assinaturas_select_tenant
on public.municipio_assinaturas
for select
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists municipio_modulos_select_tenant on public.municipio_modulos;
create policy municipio_modulos_select_tenant
on public.municipio_modulos
for select
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists saas_billing_eventos_select_tenant on public.saas_billing_eventos;
create policy saas_billing_eventos_select_tenant
on public.saas_billing_eventos
for select
to authenticated
using (
  municipio_id is not null
  and public.usuario_tem_acesso_municipio(municipio_id)
);
