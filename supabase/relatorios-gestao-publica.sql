-- Relatorios profissionais para gestao publica
-- Substitua :municipio_id, :data_inicio e :data_fim conforme o periodo.

-- 1) Alunos ativos por modalidade e turma, usando matricula historica.
select
  modalidades.nome as modalidade,
  aulas.nome as turma,
  count(distinct matriculas.aluno_id) as alunos_ativos
from public.aluno_matriculas matriculas
join public.alunos alunos on alunos.id = matriculas.aluno_id
join public.aulas aulas on aulas.id = matriculas.aula_id
join public.modalidades modalidades on modalidades.id = aulas.modalidade_id
where matriculas.municipio_id = :municipio_id
  and alunos.municipio_id = :municipio_id
  and aulas.municipio_id = :municipio_id
  and modalidades.municipio_id = :municipio_id
  and matriculas.status = 'ativo'
  and alunos.status = 'ativo'
group by modalidades.nome, aulas.nome
order by modalidades.nome, aulas.nome;

-- 2) Frequencia media por modalidade no periodo.
select
  modalidades.nome as modalidade,
  count(frequencias.id) as total_lancamentos,
  count(frequencias.id) filter (where lower(frequencias.status) = 'presente') as presencas,
  count(frequencias.id) filter (
    where lower(frequencias.status) in ('faltou', 'falta')
  ) as faltas,
  case
    when count(frequencias.id) = 0 then 0
    else round(
      count(frequencias.id) filter (where lower(frequencias.status) = 'presente')::numeric
      / count(frequencias.id)::numeric
      * 100,
      2
    )
  end as frequencia_media_percentual
from public.frequencias frequencias
join public.aulas aulas on aulas.id = frequencias.aula_id
join public.modalidades modalidades on modalidades.id = aulas.modalidade_id
where frequencias.municipio_id = :municipio_id
  and aulas.municipio_id = :municipio_id
  and modalidades.municipio_id = :municipio_id
  and frequencias.data_aula between :data_inicio and :data_fim
group by modalidades.nome
order by frequencia_media_percentual desc, modalidades.nome;

-- 3) Visitantes por destino e recorrencia no periodo, usando CRM cultural.
with visitas_periodo as (
  select
    visitas.pessoa_id,
    coalesce(visitas.destino, 'centro-cultural') as destino,
    visitas.data_visita
  from public.visitante_visitas visitas
  where visitas.municipio_id = :municipio_id
    and visitas.data_visita between :data_inicio and :data_fim
),
recorrencia as (
  select pessoa_id, count(*) as visitas
  from visitas_periodo
  group by pessoa_id
)
select
  destino,
  count(*) as total_visitas,
  count(distinct pessoa_id) as visitantes_unicos,
  count(distinct pessoa_id) filter (where recorrencia.visitas > 1) as visitantes_recorrentes,
  case
    when count(distinct pessoa_id) = 0 then 0
    else round(
      count(distinct pessoa_id) filter (where recorrencia.visitas > 1)::numeric
      / count(distinct pessoa_id)::numeric
      * 100,
      2
    )
  end as taxa_recorrencia_percentual
from visitas_periodo
join recorrencia using (pessoa_id)
group by destino
order by total_visitas desc;

-- 4) Serie diaria consolidada: frequencia e visitantes.
with dias as (
  select generate_series(:data_inicio::date, :data_fim::date, interval '1 day')::date as data
),
frequencias_dia as (
  select
    data_aula as data,
    count(*) as lancamentos,
    count(*) filter (where lower(status) = 'presente') as presencas
  from public.frequencias
  where municipio_id = :municipio_id
    and data_aula between :data_inicio and :data_fim
  group by data_aula
),
visitas_dia as (
  select data_visita as data, count(*) as visitas
  from public.visitante_visitas
  where municipio_id = :municipio_id
    and data_visita between :data_inicio and :data_fim
  group by data_visita
)
select
  dias.data,
  coalesce(frequencias_dia.lancamentos, 0) as frequencias_lancadas,
  coalesce(frequencias_dia.presencas, 0) as presencas,
  coalesce(visitas_dia.visitas, 0) as visitas
from dias
left join frequencias_dia using (data)
left join visitas_dia using (data)
order by dias.data;
