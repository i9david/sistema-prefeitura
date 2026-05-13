create extension if not exists pgcrypto;

alter table public.visitantes
  add column if not exists pessoa_id uuid references public.pessoas(id) on delete set null;

alter table public.visitantes
  add column if not exists data_nascimento date;

alter table public.visitantes
  add column if not exists created_at timestamptz not null default now();

alter table public.visitantes
  add column if not exists updated_at timestamptz not null default now();

create index if not exists visitantes_pessoa_id_idx
  on public.visitantes (municipio_id, pessoa_id);

create table if not exists public.visitante_visitas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete restrict,
  pessoa_id uuid not null references public.pessoas(id) on delete restrict,
  visitante_id uuid references public.visitantes(id) on delete set null,
  destino text not null default 'centro-cultural',
  motivo text,
  data_visita date not null,
  horario_entrada time,
  horario_saida time,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  origem text not null default 'recepcao',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists visitante_visitas_visitante_id_unico_idx
  on public.visitante_visitas (municipio_id, visitante_id)
  where visitante_id is not null;

create index if not exists visitante_visitas_pessoa_data_idx
  on public.visitante_visitas (municipio_id, pessoa_id, data_visita);

create index if not exists visitante_visitas_data_destino_idx
  on public.visitante_visitas (municipio_id, data_visita, destino);

insert into public.pessoas (
  municipio_id,
  nome,
  telefone,
  data_nascimento
)
select distinct on (visitantes.municipio_id, visitantes.telefone)
  visitantes.municipio_id,
  visitantes.nome,
  visitantes.telefone,
  visitantes.data_nascimento
from public.visitantes visitantes
where visitantes.telefone is not null
  and visitantes.telefone <> ''
  and not exists (
    select 1
    from public.pessoas pessoas
    where pessoas.municipio_id = visitantes.municipio_id
      and pessoas.telefone = visitantes.telefone
  )
order by visitantes.municipio_id, visitantes.telefone, visitantes.created_at nulls last;

update public.visitantes visitantes
set pessoa_id = pessoas.id
from public.pessoas pessoas
where visitantes.pessoa_id is null
  and visitantes.municipio_id = pessoas.municipio_id
  and visitantes.telefone = pessoas.telefone;

insert into public.visitante_visitas (
  municipio_id,
  pessoa_id,
  visitante_id,
  destino,
  motivo,
  data_visita,
  horario_entrada,
  horario_saida,
  status,
  origem,
  observacoes,
  created_at,
  updated_at
)
select
  visitantes.municipio_id,
  visitantes.pessoa_id,
  visitantes.id,
  coalesce(visitantes.destino, 'centro-cultural'),
  visitantes.motivo,
  visitantes.data_visita,
  visitantes.horario_entrada,
  visitantes.horario_saida,
  coalesce(visitantes.status, 'inativo'),
  coalesce(visitantes.origem, 'migracao_visitantes'),
  visitantes.observacoes,
  coalesce(visitantes.created_at, now()),
  coalesce(visitantes.updated_at, now())
from public.visitantes visitantes
where visitantes.pessoa_id is not null
  and visitantes.data_visita is not null
  and not exists (
    select 1
    from public.visitante_visitas visitas
    where visitas.municipio_id = visitantes.municipio_id
      and visitas.visitante_id = visitantes.id
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_visitante_visitas_updated_at on public.visitante_visitas;

create trigger set_visitante_visitas_updated_at
before update on public.visitante_visitas
for each row
execute function public.set_updated_at();

alter table public.visitante_visitas enable row level security;

drop policy if exists tenant_isolation_select on public.visitante_visitas;
create policy tenant_isolation_select
on public.visitante_visitas
for select
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_insert on public.visitante_visitas;
create policy tenant_isolation_insert
on public.visitante_visitas
for insert
to authenticated
with check (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_update on public.visitante_visitas;
create policy tenant_isolation_update
on public.visitante_visitas
for update
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id))
with check (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_delete on public.visitante_visitas;
create policy tenant_isolation_delete
on public.visitante_visitas
for delete
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id));
