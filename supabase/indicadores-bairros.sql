-- Indicadores estrategicos por bairro.
-- Fonte padrao: public.pessoas.bairro.
-- Substitua :municipio_id pelo tenant atual quando executar manualmente.

alter table public.pessoas
  add column if not exists bairro text;

create index if not exists pessoas_bairro_idx
  on public.pessoas (municipio_id, bairro);

create index if not exists alunos_pessoa_status_idx
  on public.alunos (municipio_id, pessoa_id, status)
  where pessoa_id is not null;

create index if not exists visitante_visitas_pessoa_idx
  on public.visitante_visitas (municipio_id, pessoa_id)
  where pessoa_id is not null;

-- 1. Ranking de bairros por pessoas atendidas.
with pessoas_base as (
  select
    id,
    coalesce(nullif(trim(bairro), ''), 'Nao informado') as bairro
  from public.pessoas
  where municipio_id = :municipio_id
),
atendimentos as (
  select distinct pessoa_id
  from public.alunos
  where municipio_id = :municipio_id
    and pessoa_id is not null

  union

  select distinct pessoa_id
  from public.visitante_visitas
  where municipio_id = :municipio_id
    and pessoa_id is not null
),
alunos_ativos as (
  select pessoa_id, count(*) as total
  from public.alunos
  where municipio_id = :municipio_id
    and pessoa_id is not null
    and status = 'ativo'
  group by pessoa_id
),
visitas as (
  select pessoa_id, count(*) as total
  from public.visitante_visitas
  where municipio_id = :municipio_id
    and pessoa_id is not null
  group by pessoa_id
)
select
  pessoas_base.bairro,
  count(distinct pessoas_base.id) as pessoas_cadastradas,
  count(distinct atendimentos.pessoa_id) as pessoas_atendidas,
  coalesce(sum(alunos_ativos.total), 0) as alunos_ativos,
  coalesce(sum(visitas.total), 0) as visitantes,
  case
    when count(distinct pessoas_base.id) = 0 then 0
    else round(
      count(distinct atendimentos.pessoa_id)::numeric
      / count(distinct pessoas_base.id)::numeric
      * 100,
      2
    )
  end as taxa_cobertura
from pessoas_base
left join atendimentos on atendimentos.pessoa_id = pessoas_base.id
left join alunos_ativos on alunos_ativos.pessoa_id = pessoas_base.id
left join visitas on visitas.pessoa_id = pessoas_base.id
group by pessoas_base.bairro
order by pessoas_atendidas desc, pessoas_base.bairro;

-- 2. Bairros com menor cobertura.
with ranking as (
  with pessoas_base as (
    select
      id,
      coalesce(nullif(trim(bairro), ''), 'Nao informado') as bairro
    from public.pessoas
    where municipio_id = :municipio_id
  ),
  atendimentos as (
    select distinct pessoa_id
    from public.alunos
    where municipio_id = :municipio_id
      and pessoa_id is not null

    union

    select distinct pessoa_id
    from public.visitante_visitas
    where municipio_id = :municipio_id
      and pessoa_id is not null
  )
  select
    pessoas_base.bairro,
    count(distinct pessoas_base.id) as pessoas_cadastradas,
    count(distinct atendimentos.pessoa_id) as pessoas_atendidas,
    case
      when count(distinct pessoas_base.id) = 0 then 0
      else round(
        count(distinct atendimentos.pessoa_id)::numeric
        / count(distinct pessoas_base.id)::numeric
        * 100,
        2
      )
    end as taxa_cobertura
  from pessoas_base
  left join atendimentos on atendimentos.pessoa_id = pessoas_base.id
  group by pessoas_base.bairro
)
select *
from ranking
where pessoas_cadastradas > 0
order by taxa_cobertura asc, pessoas_atendidas asc, bairro
limit 10;

-- 3. Resumo geral.
with pessoas_base as (
  select id
  from public.pessoas
  where municipio_id = :municipio_id
),
atendimentos as (
  select distinct pessoa_id
  from public.alunos
  where municipio_id = :municipio_id
    and pessoa_id is not null

  union

  select distinct pessoa_id
  from public.visitante_visitas
  where municipio_id = :municipio_id
    and pessoa_id is not null
)
select
  count(distinct pessoas_base.id) as pessoas_cadastradas,
  count(distinct atendimentos.pessoa_id) as pessoas_atendidas,
  case
    when count(distinct pessoas_base.id) = 0 then 0
    else round(
      count(distinct atendimentos.pessoa_id)::numeric
      / count(distinct pessoas_base.id)::numeric
      * 100,
      2
    )
  end as taxa_cobertura_geral
from pessoas_base
left join atendimentos on atendimentos.pessoa_id = pessoas_base.id;
