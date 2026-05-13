create table if not exists public.banda_municipal_presencas (
  id uuid primary key default gen_random_uuid(),
  musico_id uuid not null references public.banda_municipal_musicos(id) on delete cascade,
  ensaio_id uuid references public.banda_municipal_ensaios(id) on delete cascade,
  apresentacao_id uuid references public.banda_municipal_apresentacoes(id) on delete cascade,
  tipo text not null,
  data date not null,
  status text not null default 'presente',
  hora_registro timestamptz not null default now(),
  observacao text,
  valor_unitario numeric(12,2) not null default 0,
  valor_total numeric(12,2) not null default 0,
  status_pagamento text not null default 'pendente',
  municipio_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banda_municipal_presencas_tipo_check
    check (tipo in ('ensaio', 'apresentacao')),
  constraint banda_municipal_presencas_status_check
    check (status in ('presente', 'falta', 'justificado')),
  constraint banda_municipal_presencas_pagamento_check
    check (status_pagamento in ('pendente', 'calculado', 'pago', 'cancelado')),
  constraint banda_municipal_presencas_valores_check
    check (valor_unitario >= 0 and valor_total >= 0),
  constraint banda_municipal_presencas_evento_check
    check (
      (tipo = 'ensaio' and ensaio_id is not null and apresentacao_id is null)
      or
      (tipo = 'apresentacao' and apresentacao_id is not null and ensaio_id is null)
    )
);

alter table public.banda_municipal_presencas
  add column if not exists valor_unitario numeric(12,2) not null default 0,
  add column if not exists valor_total numeric(12,2) not null default 0,
  add column if not exists status_pagamento text not null default 'pendente';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'banda_municipal_presencas_pagamento_check'
  ) then
    alter table public.banda_municipal_presencas
      add constraint banda_municipal_presencas_pagamento_check
      check (status_pagamento in ('pendente', 'calculado', 'pago', 'cancelado'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'banda_municipal_presencas_valores_check'
  ) then
    alter table public.banda_municipal_presencas
      add constraint banda_municipal_presencas_valores_check
      check (valor_unitario >= 0 and valor_total >= 0);
  end if;
end $$;

create unique index if not exists banda_municipal_presencas_ensaio_unico
  on public.banda_municipal_presencas (municipio_id, musico_id, ensaio_id, data)
  where tipo = 'ensaio' and ensaio_id is not null;

create unique index if not exists banda_municipal_presencas_apresentacao_unica
  on public.banda_municipal_presencas (municipio_id, musico_id, apresentacao_id, data)
  where tipo = 'apresentacao' and apresentacao_id is not null;

create index if not exists banda_municipal_presencas_musico_idx
  on public.banda_municipal_presencas (municipio_id, musico_id, data desc);

create index if not exists banda_municipal_presencas_evento_idx
  on public.banda_municipal_presencas (municipio_id, tipo, data desc);
