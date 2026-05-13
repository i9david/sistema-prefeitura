create extension if not exists pgcrypto;

create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists alunos_pessoa_id_idx on public.alunos(pessoa_id);
create index if not exists alunos_aula_id_idx on public.alunos(aula_id);
create index if not exists alunos_status_idx on public.alunos(status);
create index if not exists alunos_nome_idx on public.alunos(nome);

alter table public.alunos
  add column if not exists pessoa_id uuid references public.pessoas(id) on delete set null;

alter table public.alunos
  add column if not exists biometria_cadastrada boolean not null default false;

alter table public.alunos
  add column if not exists created_at timestamptz not null default now();

alter table public.alunos
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'frequencias_aluno_id_fkey'
  ) then
    alter table public.frequencias
      add constraint frequencias_aluno_id_fkey
      foreign key (aluno_id) references public.alunos(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'frequencias_aula_id_fkey'
  ) then
    alter table public.frequencias
      add constraint frequencias_aula_id_fkey
      foreign key (aula_id) references public.aulas(id) on delete cascade;
  end if;
end $$;

create index if not exists frequencias_aluno_id_idx on public.frequencias(aluno_id);
create index if not exists frequencias_aula_data_idx on public.frequencias(aula_id, data_aula);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_alunos_updated_at on public.alunos;

create trigger set_alunos_updated_at
before update on public.alunos
for each row
execute function public.set_updated_at();
