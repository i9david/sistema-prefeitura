-- Relatórios institucionais para gestão pública
-- Substitua :municipio_id, :data_inicio e :data_fim pelos valores do tenant/período.

-- 1. Relatório mensal de atividades
select modulo, tipo, status, count(*) as total
from public.agenda_eventos
where municipio_id = :municipio_id
  and data_inicio between :data_inicio and :data_fim
group by modulo, tipo, status
order by modulo, tipo, status;

select 'Banda Municipal' as modulo, 'ensaio' as tipo, status, count(*) as total
from public.banda_municipal_ensaios
where municipio_id = :municipio_id
  and data_ensaio between :data_inicio and :data_fim
group by status
union all
select 'Banda Municipal' as modulo, 'apresentacao' as tipo, status, count(*) as total
from public.banda_municipal_apresentacoes
where municipio_id = :municipio_id
  and data_apresentacao between :data_inicio and :data_fim
group by status;

-- 2. Relatório de frequência por modalidade
select
  modalidades.nome as modalidade,
  count(frequencias.id) as lancamentos,
  count(frequencias.id) filter (where lower(frequencias.status) = 'presente') as presencas,
  count(frequencias.id) filter (where lower(frequencias.status) in ('falta', 'faltou')) as faltas,
  case
    when count(frequencias.id) = 0 then 0
    else round(
      count(frequencias.id) filter (where lower(frequencias.status) = 'presente')::numeric
      / count(frequencias.id)::numeric * 100,
      2
    )
  end as frequencia_media
from public.frequencias frequencias
left join public.aulas aulas on aulas.id = frequencias.aula_id
left join public.modalidades modalidades on modalidades.id = aulas.modalidade_id
where frequencias.municipio_id = :municipio_id
  and frequencias.data_aula between :data_inicio and :data_fim
group by modalidades.nome
order by lancamentos desc, modalidade;

-- 3. Relatório de visitantes por destino
select
  coalesce(destino, 'centro-cultural') as destino,
  count(*) as visitas,
  count(distinct pessoa_id) as visitantes_unicos,
  count(distinct pessoa_id) filter (
    where pessoa_id in (
      select pessoa_id
      from public.visitante_visitas
      where municipio_id = :municipio_id
        and data_visita between :data_inicio and :data_fim
      group by pessoa_id
      having count(*) > 1
    )
  ) as visitantes_recorrentes
from public.visitante_visitas
where municipio_id = :municipio_id
  and data_visita between :data_inicio and :data_fim
group by destino
order by visitas desc, destino;

-- 4. Relatório da banda por presença e pagamento
select
  tipo,
  status,
  status_pagamento,
  count(*) as lancamentos,
  sum(valor_total) as valor_total
from public.banda_municipal_presencas
where municipio_id = :municipio_id
  and data between :data_inicio and :data_fim
group by tipo, status, status_pagamento
order by tipo, status, status_pagamento;
