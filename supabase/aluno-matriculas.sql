create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.aluno_matriculas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  modalidade_id uuid references public.modalidades(id) on delete restrict,
  aula_id uuid not null references public.aulas(id) on delete restrict,
  data_inicio date not null default current_date,
  data_fim date,
  status text not null default 'ativo',
  municipio_id uuid not null references public.municipios(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'aluno_matriculas'
      and column_name = 'data_matricula'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'aluno_matriculas'
      and column_name = 'data_inicio'
  ) then
    alter table public.aluno_matriculas
      rename column data_matricula to data_inicio;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'aluno_matriculas'
      and column_name = 'data_encerramento'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'aluno_matriculas'
      and column_name = 'data_fim'
  ) then
    alter table public.aluno_matriculas
      rename column data_encerramento to data_fim;
  end if;
end $$;

alter table public.aluno_matriculas
  add column if not exists modalidade_id uuid references public.modalidades(id) on delete restrict;

alter table public.aluno_matriculas
  add column if not exists data_inicio date not null default current_date;

alter table public.aluno_matriculas
  add column if not exists data_fim date;

alter table public.aluno_matriculas
  add column if not exists created_at timestamptz not null default now();

alter table public.aluno_matriculas
  add column if not exists updated_at timestamptz not null default now();

alter table public.aluno_matriculas
  drop constraint if exists aluno_matriculas_status_check;

alter table public.aluno_matriculas
  drop constraint if exists aluno_matriculas_periodo_valido;

alter table public.aluno_matriculas
  drop constraint if exists aluno_matriculas_ativa_sem_sobreposicao;

update public.aluno_matriculas
set status = case
  when status = 'ativa' then 'ativo'
  when status = 'encerrada' then 'concluido'
  when status = 'cancelada' then 'trancado'
  else status
end
where status in ('ativa', 'encerrada', 'cancelada');

update public.aluno_matriculas matriculas
set modalidade_id = aulas.modalidade_id
from public.aulas aulas
where matriculas.aula_id = aulas.id
  and matriculas.modalidade_id is null;

alter table public.aluno_matriculas
  alter column modalidade_id set not null;

alter table public.aluno_matriculas
  add constraint aluno_matriculas_status_check
  check (status in ('ativo', 'trancado', 'concluido'));

alter table public.aluno_matriculas
  add constraint aluno_matriculas_periodo_valido
  check (data_fim is null or data_fim >= data_inicio);

drop index if exists aluno_matriculas_ativa_unica_idx;

create unique index if not exists aluno_matriculas_ativo_aula_unico_idx
  on public.aluno_matriculas (municipio_id, aluno_id, aula_id)
  where status = 'ativo';

alter table public.aluno_matriculas
  add constraint aluno_matriculas_ativa_sem_sobreposicao
  exclude using gist (
    municipio_id with =,
    aluno_id with =,
    aula_id with =,
    daterange(data_inicio, coalesce(data_fim, 'infinity'::date), '[]') with &&
  )
  where (status = 'ativo');

create index if not exists aluno_matriculas_municipio_aluno_idx
  on public.aluno_matriculas (municipio_id, aluno_id);

create index if not exists aluno_matriculas_municipio_aula_idx
  on public.aluno_matriculas (municipio_id, aula_id);

create index if not exists aluno_matriculas_municipio_modalidade_idx
  on public.aluno_matriculas (municipio_id, modalidade_id);

create index if not exists aluno_matriculas_status_idx
  on public.aluno_matriculas (municipio_id, status);

insert into public.aluno_matriculas (
  municipio_id,
  aluno_id,
  modalidade_id,
  aula_id,
  data_inicio,
  status,
  created_at,
  updated_at
)
select
  alunos.municipio_id,
  alunos.id,
  aulas.modalidade_id,
  alunos.aula_id,
  coalesce(alunos.created_at::date, current_date),
  'ativo',
  now(),
  now()
from public.alunos alunos
join public.aulas aulas on aulas.id = alunos.aula_id
where alunos.aula_id is not null
  and not exists (
    select 1
    from public.aluno_matriculas matriculas
    where matriculas.municipio_id = alunos.municipio_id
      and matriculas.aluno_id = alunos.id
      and matriculas.aula_id = alunos.aula_id
      and matriculas.status = 'ativo'
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

drop trigger if exists set_aluno_matriculas_updated_at on public.aluno_matriculas;

create trigger set_aluno_matriculas_updated_at
before update on public.aluno_matriculas
for each row
execute function public.set_updated_at();

alter table public.aluno_matriculas enable row level security;

drop policy if exists tenant_isolation_select on public.aluno_matriculas;
create policy tenant_isolation_select
on public.aluno_matriculas
for select
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_insert on public.aluno_matriculas;
create policy tenant_isolation_insert
on public.aluno_matriculas
for insert
to authenticated
with check (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_update on public.aluno_matriculas;
create policy tenant_isolation_update
on public.aluno_matriculas
for update
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id))
with check (public.usuario_tem_acesso_municipio(municipio_id));

drop policy if exists tenant_isolation_delete on public.aluno_matriculas;
create policy tenant_isolation_delete
on public.aluno_matriculas
for delete
to authenticated
using (public.usuario_tem_acesso_municipio(municipio_id));
