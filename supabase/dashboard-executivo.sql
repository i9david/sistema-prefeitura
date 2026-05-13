-- Dashboard executivo institucional
-- Substitua :municipio_id, :data_inicio e :data_fim pelos valores do tenant/período.

-- Total de alunos ativos
select count(*) as total_alunos_ativos
from public.alunos
where municipio_id = :municipio_id
  and status = 'ativo';

-- Frequência média no período
select
  count(*) as total_lancamentos,
  count(*) filter (where lower(status) = 'presente') as total_presencas,
  case
    when count(*) = 0 then 0
    else round((count(*) filter (where lower(status) = 'presente')::numeric / count(*)) * 100, 2)
  end as frequencia_media
from public.frequencias
where municipio_id = :municipio_id
  and data_aula between :data_inicio and :data_fim;

-- Evasão nos últimos 30 dias
select count(*) as total_evasoes
from public.aluno_matriculas
where municipio_id = :municipio_id
  and status in ('trancado', 'concluido')
  and data_fim between :data_inicio and :data_fim;

-- Atividades realizadas no período
select
  (
    select count(*)
    from public.agenda_eventos
    where municipio_id = :municipio_id
      and status = 'realizado'
      and data_inicio between :data_inicio and :data_fim
  )
  +
  (
    select count(*)
    from public.banda_municipal_ensaios
    where municipio_id = :municipio_id
      and status = 'realizado'
      and data_ensaio between :data_inicio and :data_fim
  )
  +
  (
    select count(*)
    from public.banda_municipal_apresentacoes
    where municipio_id = :municipio_id
      and status = 'realizada'
      and data_apresentacao between :data_inicio and :data_fim
  ) as atividades_realizadas;

-- Visitantes atendidos no período
select count(*) as visitantes_atendidos
from public.visitante_visitas
where municipio_id = :municipio_id
  and data_visita between :data_inicio and :data_fim;

-- Presença da banda no período
select
  count(*) as total_lancamentos_banda,
  count(*) filter (where status = 'presente') as presencas_banda,
  case
    when count(*) = 0 then 0
    else round((count(*) filter (where status = 'presente')::numeric / count(*)) * 100, 2)
  end as presenca_banda
from public.banda_municipal_presencas
where municipio_id = :municipio_id
  and data between :data_inicio and :data_fim;
