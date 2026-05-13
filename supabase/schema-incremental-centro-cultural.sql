-- Add missing foreign keys for banda_municipal_presencas
alter table public.banda_municipal_presencas add constraint if not exists banda_municipal_presencas_municipio_id_fkey foreign key (municipio_id) references public.municipios(id) on delete cascade;
