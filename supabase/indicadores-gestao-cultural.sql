-- Indicadores de gestao cultural
-- Substitua :municipio_id, :data_inicio e :data_fim pelos valores do periodo.

-- 1) Total de alunos ativos com matricula ativa
select count(distinct matriculas.aluno_id) as total_alunos_ativos
from public.aluno_matriculas matriculas
join public.alunos alunos on alunos.id = matriculas.aluno_id
where matriculas.municipio_id = :municipio_id
  and alunos.municipio_id = :municipio_id
  and matriculas.status = 'ativo'
  and alunos.status = 'ativo';

-- 2) Taxa de evasao no periodo
with matriculas_periodo as (
  select matriculas.id, matriculas.status, matriculas.data_fim
  from public.aluno_matriculas matriculas
  where matriculas.municipio_id = :municipio_id
    and matriculas.data_inicio <= :data_fim
    and (
      matriculas.data_fim is null
      or matriculas.data_fim >= :data_inicio
    )
),
evasoes_periodo as (
  select id
  from matriculas_periodo
  where status in ('trancado', 'concluido')
    and data_fim between :data_inicio and :data_fim
)
select
  count(distinct evasoes_periodo.id) as total_evasoes,
  count(distinct matriculas_periodo.id) as total_matriculas_periodo,
  case
    when count(distinct matriculas_periodo.id) = 0 then 0
    else round(
      count(distinct evasoes_periodo.id)::numeric
      / count(distinct matriculas_periodo.id)::numeric
      * 100,
      2
    )
  end as taxa_evasao_percentual
from matriculas_periodo
left join evasoes_periodo on evasoes_periodo.id = matriculas_periodo.id;

-- 3) Frequencia media no periodo
select
  count(*) as total_lancamentos,
  count(*) filter (where lower(status) = 'presente') as total_presencas,
  case
    when count(*) = 0 then 0
    else round(
      count(*) filter (where lower(status) = 'presente')::numeric
      / count(*)::numeric
      * 100,
      2
    )
  end as frequencia_media_percentual
from public.frequencias
where municipio_id = :municipio_id
  and data_aula between :data_inicio and :data_fim;

-- 4) Ranking de modalidades por alunos ativos
select
  modalidades.id as modalidade_id,
  modalidades.nome as modalidade,
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
group by modalidades.id, modalidades.nome
order by alunos_ativos desc, modalidade asc;
