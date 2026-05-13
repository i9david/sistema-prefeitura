create extension if not exists pgcrypto;

create table if not exists public.agenda_eventos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete restrict,
  titulo text not null,
  descricao text,
  modulo text not null default 'Centro Cultural',
  tipo text not null default 'evento',
  data_inicio date not null,
  data_fim date,
  horario_inicio time,
  horario_fim time,
  local text,
  status text not null default 'agendado' check (
    status in ('agendado', 'realizado', 'cancelado')
  ),
  origem text not null default 'manual',
  referencia_tabela text,
  referencia_id uuid,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agenda_eventos_periodo_valido check (
    data_fim is null or data_fim >= data_inicio
  )
);

create index if not exists agenda_eventos_periodo_idx
  on public.agenda_eventos (municipio_id, data_inicio, data_fim);

create index if not exists agenda_eventos_modulo_tipo_idx
  on public.agenda_eventos (municipio_id, modulo, tipo);

create index if not exists agenda_eventos_referencia_idx
  on public.agenda_eventos (municipio_id, referencia_tabela, referencia_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_agenda_eventos_updated_at on public.agenda_eventos;

create trigger set_agenda_eventos_updated_at
before update on public.agenda_eventos
for each row
execute function public.set_updated_at();

alter table public.agenda_eventos enable row level security;

drop policy if exists tenant_isolation_select on public.agenda_eventos;
create policy tenant_isolation_select
on public.agenda_eventos
for select
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_insert on public.agenda_eventos;
create policy tenant_isolation_insert
on public.agenda_eventos
for insert
to authenticated
with check (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_update on public.agenda_eventos;
create policy tenant_isolation_update
on public.agenda_eventos
for update
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id))
with check (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_delete on public.agenda_eventos;
create policy tenant_isolation_delete
on public.agenda_eventos
for delete
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id));
