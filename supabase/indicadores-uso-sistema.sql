-- Indicadores estrategicos de uso do sistema a partir de administrativo_logs.
-- Substitua :municipio_id, :data_inicio e :data_fim conforme o periodo desejado.

-- Indices recomendados para manter as consultas por tenant e periodo eficientes.
create index if not exists administrativo_logs_periodo_idx
  on public.administrativo_logs (municipio_id, created_at desc);

create index if not exists administrativo_logs_modulo_periodo_idx
  on public.administrativo_logs (municipio_id, modulo, created_at desc);

create index if not exists administrativo_logs_usuario_periodo_idx
  on public.administrativo_logs (municipio_id, usuario_id, created_at desc)
  where usuario_id is not null;

-- 1. Usuarios ativos nos ultimos 7 e 30 dias.
select
  count(distinct coalesce(usuario_id::text, usuario_email)) filter (
    where created_at >= now() - interval '7 days'
  ) as usuarios_ativos_7_dias,
  count(distinct coalesce(usuario_id::text, usuario_email)) filter (
    where created_at >= now() - interval '30 days'
  ) as usuarios_ativos_30_dias
from public.administrativo_logs
where municipio_id = :municipio_id
  and created_at >= now() - interval '30 days'
  and coalesce(usuario_id::text, usuario_email) is not null;

-- 2. Acessos/eventos por modulo no periodo.
select
  coalesce(modulo, 'Nao informado') as modulo,
  count(*) as total
from public.administrativo_logs
where municipio_id = :municipio_id
  and created_at between :data_inicio and :data_fim
group by coalesce(modulo, 'Nao informado')
order by total desc, modulo;

-- 3. Evolucao diaria de uso.
select
  date_trunc('day', created_at at time zone 'America/Sao_Paulo')::date as data,
  count(*) as total
from public.administrativo_logs
where municipio_id = :municipio_id
  and created_at between :data_inicio and :data_fim
group by 1
order by 1;

-- 4. Horarios de maior uso.
select
  extract(hour from created_at at time zone 'America/Sao_Paulo')::int as hora,
  count(*) as total
from public.administrativo_logs
where municipio_id = :municipio_id
  and created_at between :data_inicio and :data_fim
group by 1
order by total desc, hora
limit 8;
