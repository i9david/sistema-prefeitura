create extension if not exists pgcrypto;

create table if not exists public.almoxarifado_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.almoxarifado_produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria_id uuid not null,
  unidade text not null,
  quantidade_atual numeric(14,3) not null default 0,
  quantidade_minima numeric(14,3) not null default 0,
  ativo boolean not null default true,
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.almoxarifado_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null,
  tipo text not null,
  quantidade numeric(14,3) not null,
  destino text,
  centro_custo text,
  responsavel_solicitacao text,
  observacao text,
  usuario_id uuid,
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.almoxarifado_categorias
  add column if not exists nome text,
  add column if not exists descricao text,
  add column if not exists municipio_id uuid,
  add column if not exists created_at timestamptz not null default now();

alter table public.almoxarifado_produtos
  add column if not exists nome text,
  add column if not exists categoria_id uuid,
  add column if not exists unidade text,
  add column if not exists quantidade_atual numeric(14,3) not null default 0,
  add column if not exists quantidade_minima numeric(14,3) not null default 0,
  add column if not exists ativo boolean not null default true,
  add column if not exists municipio_id uuid,
  add column if not exists created_at timestamptz not null default now();

alter table public.almoxarifado_movimentacoes
  add column if not exists produto_id uuid,
  add column if not exists tipo text,
  add column if not exists quantidade numeric(14,3),
  add column if not exists destino text,
  add column if not exists centro_custo text,
  add column if not exists responsavel_solicitacao text,
  add column if not exists observacao text,
  add column if not exists usuario_id uuid,
  add column if not exists municipio_id uuid,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists almoxarifado_categorias_nome_unico
  on public.almoxarifado_categorias (municipio_id, lower(nome));

create unique index if not exists almoxarifado_categorias_id_municipio_unico
  on public.almoxarifado_categorias (id, municipio_id);

create unique index if not exists almoxarifado_produtos_nome_unico
  on public.almoxarifado_produtos (municipio_id, lower(nome));

create unique index if not exists almoxarifado_produtos_id_municipio_unico
  on public.almoxarifado_produtos (id, municipio_id);

create index if not exists almoxarifado_produtos_municipio_idx
  on public.almoxarifado_produtos (municipio_id);

create index if not exists almoxarifado_produtos_categoria_idx
  on public.almoxarifado_produtos (municipio_id, categoria_id);

create index if not exists almoxarifado_movimentacoes_produto_idx
  on public.almoxarifado_movimentacoes (municipio_id, produto_id, created_at desc);

create index if not exists almoxarifado_movimentacoes_relatorios_idx
  on public.almoxarifado_movimentacoes (municipio_id, tipo, created_at desc, destino);

create index if not exists almoxarifado_movimentacoes_centro_custo_idx
  on public.almoxarifado_movimentacoes (municipio_id, centro_custo, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_categorias_municipio_id_fkey'
      and conrelid = 'public.almoxarifado_categorias'::regclass
  ) then
    alter table public.almoxarifado_categorias
      add constraint almoxarifado_categorias_municipio_id_fkey
      foreign key (municipio_id) references public.municipios(id) on delete cascade not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_produtos_municipio_id_fkey'
      and conrelid = 'public.almoxarifado_produtos'::regclass
  ) then
    alter table public.almoxarifado_produtos
      add constraint almoxarifado_produtos_municipio_id_fkey
      foreign key (municipio_id) references public.municipios(id) on delete cascade not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_produtos_categoria_id_fkey'
      and conrelid = 'public.almoxarifado_produtos'::regclass
  ) then
    alter table public.almoxarifado_produtos
      add constraint almoxarifado_produtos_categoria_id_fkey
      foreign key (categoria_id) references public.almoxarifado_categorias(id) on delete restrict not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_produtos_categoria_tenant_fkey'
      and conrelid = 'public.almoxarifado_produtos'::regclass
  ) then
    alter table public.almoxarifado_produtos
      add constraint almoxarifado_produtos_categoria_tenant_fkey
      foreign key (categoria_id, municipio_id)
      references public.almoxarifado_categorias(id, municipio_id)
      on delete restrict not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_movimentacoes_municipio_id_fkey'
      and conrelid = 'public.almoxarifado_movimentacoes'::regclass
  ) then
    alter table public.almoxarifado_movimentacoes
      add constraint almoxarifado_movimentacoes_municipio_id_fkey
      foreign key (municipio_id) references public.municipios(id) on delete cascade not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_movimentacoes_produto_id_fkey'
      and conrelid = 'public.almoxarifado_movimentacoes'::regclass
  ) then
    alter table public.almoxarifado_movimentacoes
      add constraint almoxarifado_movimentacoes_produto_id_fkey
      foreign key (produto_id) references public.almoxarifado_produtos(id) on delete restrict not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_movimentacoes_produto_tenant_fkey'
      and conrelid = 'public.almoxarifado_movimentacoes'::regclass
  ) then
    alter table public.almoxarifado_movimentacoes
      add constraint almoxarifado_movimentacoes_produto_tenant_fkey
      foreign key (produto_id, municipio_id)
      references public.almoxarifado_produtos(id, municipio_id)
      on delete restrict not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_movimentacoes_usuario_id_fkey'
      and conrelid = 'public.almoxarifado_movimentacoes'::regclass
  ) then
    alter table public.almoxarifado_movimentacoes
      add constraint almoxarifado_movimentacoes_usuario_id_fkey
      foreign key (usuario_id) references public.administrativo_usuarios(id) on delete set null not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_categorias_campos_obrigatorios'
      and conrelid = 'public.almoxarifado_categorias'::regclass
  ) then
    alter table public.almoxarifado_categorias
      add constraint almoxarifado_categorias_campos_obrigatorios
      check (
        nome is not null
        and municipio_id is not null
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_produtos_campos_obrigatorios'
      and conrelid = 'public.almoxarifado_produtos'::regclass
  ) then
    alter table public.almoxarifado_produtos
      add constraint almoxarifado_produtos_campos_obrigatorios
      check (
        nome is not null
        and categoria_id is not null
        and unidade is not null
        and quantidade_atual is not null
        and quantidade_minima is not null
        and ativo is not null
        and municipio_id is not null
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_produtos_quantidades_validas'
      and conrelid = 'public.almoxarifado_produtos'::regclass
  ) then
    alter table public.almoxarifado_produtos
      add constraint almoxarifado_produtos_quantidades_validas
      check (quantidade_atual >= 0 and quantidade_minima >= 0) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_movimentacoes_campos_obrigatorios'
      and conrelid = 'public.almoxarifado_movimentacoes'::regclass
  ) then
    alter table public.almoxarifado_movimentacoes
      add constraint almoxarifado_movimentacoes_campos_obrigatorios
      check (
        produto_id is not null
        and tipo is not null
        and quantidade is not null
        and municipio_id is not null
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_movimentacoes_tipo_valido'
      and conrelid = 'public.almoxarifado_movimentacoes'::regclass
  ) then
    alter table public.almoxarifado_movimentacoes
      add constraint almoxarifado_movimentacoes_tipo_valido
      check (tipo in ('entrada', 'saida', 'ajuste')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_movimentacoes_destino_valido'
      and conrelid = 'public.almoxarifado_movimentacoes'::regclass
  ) then
    alter table public.almoxarifado_movimentacoes
      add constraint almoxarifado_movimentacoes_destino_valido
      check (
        destino is null
        or destino in ('setor', 'evento', 'aula', 'banda', 'turismo')
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'almoxarifado_movimentacoes_quantidade_valida'
      and conrelid = 'public.almoxarifado_movimentacoes'::regclass
  ) then
    alter table public.almoxarifado_movimentacoes
      add constraint almoxarifado_movimentacoes_quantidade_valida
      check (
        (tipo in ('entrada', 'saida') and quantidade > 0)
        or (tipo = 'ajuste' and quantidade <> 0)
      ) not valid;
  end if;
end $$;

insert into public.saas_modulos (modulo, nome, descricao, ordem)
values
  ('almoxarifado', 'Almoxarifado', 'Categorias, produtos, estoque mínimo e movimentações de materiais.', 80)
on conflict (modulo) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  ordem = excluded.ordem;

insert into public.municipio_modulos (municipio_id, modulo, ativo)
select id, 'almoxarifado', true
from public.municipios
on conflict (municipio_id, modulo) do nothing;

create or replace function public.aplicar_movimentacao_almoxarifado()
returns trigger
language plpgsql
as $$
declare
  estoque_atual numeric(14,3);
  delta numeric(14,3);
  estoque_novo numeric(14,3);
begin
  select quantidade_atual
    into estoque_atual
  from public.almoxarifado_produtos
  where id = new.produto_id
    and municipio_id = new.municipio_id
    and ativo = true
  for update;

  if estoque_atual is null then
    raise exception 'Produto não encontrado ou inativo para este município.';
  end if;

  if new.tipo = 'entrada' then
    delta := abs(new.quantidade);
  elsif new.tipo = 'saida' then
    delta := -abs(new.quantidade);
  else
    delta := new.quantidade;
  end if;

  estoque_novo := estoque_atual + delta;

  if estoque_novo < 0 then
    raise exception 'Movimentação inválida: estoque não pode ficar negativo.';
  end if;

  update public.almoxarifado_produtos
     set quantidade_atual = estoque_novo
   where id = new.produto_id
     and municipio_id = new.municipio_id;

  return new;
end;
$$;

drop trigger if exists almoxarifado_movimentacoes_aplicar_estoque
  on public.almoxarifado_movimentacoes;

create trigger almoxarifado_movimentacoes_aplicar_estoque
before insert on public.almoxarifado_movimentacoes
for each row
execute function public.aplicar_movimentacao_almoxarifado();
