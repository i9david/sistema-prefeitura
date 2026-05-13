create extension if not exists pgcrypto;

do $$
begin
  create table if not exists public.municipios (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    slug text not null unique,
    uf text,
    cnpj text,
    status text not null default 'ativo',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  if not exists (
    select 1
    from pg_constraint
    where conname = 'municipios_status_check'
      and conrelid = 'public.municipios'::regclass
  ) then
    alter table public.municipios
      add constraint municipios_status_check
      check (status in ('ativo', 'inativo'));
  end if;
end $$;

do $$
declare
  mineiros_id constant uuid := '30bbd150-57d9-4375-9c09-d9303c7a54c6';
begin
  if exists (select 1 from public.municipios where id = mineiros_id) then
    update public.municipios
    set
      nome = 'Mineiros',
      slug = 'mineiros',
      uf = 'GO',
      status = 'ativo',
      updated_at = now()
    where id = mineiros_id;
  elsif exists (select 1 from public.municipios where slug = 'mineiros') then
    update public.municipios
    set
      id = mineiros_id,
      nome = 'Mineiros',
      uf = 'GO',
      status = 'ativo',
      updated_at = now()
    where slug = 'mineiros';
  else
    insert into public.municipios (id, nome, slug, uf, status)
    values (mineiros_id, 'Mineiros', 'mineiros', 'GO', 'ativo');
  end if;
end $$;

create table if not exists public.municipio_modulos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  modulo text not null,
  ativo boolean not null default true,
  ativado_em timestamptz not null default now(),
  desativado_em timestamptz,
  unique (municipio_id, modulo)
);

do $$
declare
  mineiros_id constant uuid := '30bbd150-57d9-4375-9c09-d9303c7a54c6';
  tabela text;
begin
  foreach tabela in array array[
    'administrativo_usuarios',
    'administrativo_acessos',
    'municipio_modulos'
  ] loop
    if to_regclass('public.' || tabela) is not null then
      execute format(
        'alter table public.%I add column if not exists municipio_id uuid',
        tabela
      );

      execute format(
        'update public.%I set municipio_id = $1 where municipio_id is null',
        tabela
      )
      using mineiros_id;

      execute format(
        'alter table public.%I alter column municipio_id set not null',
        tabela
      );

      execute format(
        'create index if not exists %I on public.%I(municipio_id)',
        tabela || '_municipio_id_idx',
        tabela
      );

      if not exists (
        select 1
        from pg_constraint
        where conname = tabela || '_municipio_id_fkey'
          and conrelid = ('public.' || tabela)::regclass
      ) then
        execute format(
          'alter table public.%I add constraint %I foreign key (municipio_id) references public.municipios(id) on delete restrict',
          tabela,
          tabela || '_municipio_id_fkey'
        );
      end if;
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.municipio_modulos') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'municipio_modulos_municipio_id_modulo_key'
         and conrelid = 'public.municipio_modulos'::regclass
     )
     and not exists (
       select 1
       from public.municipio_modulos
       group by municipio_id, modulo
       having count(*) > 1
     ) then
    alter table public.municipio_modulos
      add constraint municipio_modulos_municipio_id_modulo_key
      unique (municipio_id, modulo);
  end if;
end $$;
