do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'frequencias_municipio_aula_aluno_data_key'
  ) then
    alter table public.frequencias
      add constraint frequencias_municipio_aula_aluno_data_key
      unique (municipio_id, aula_id, aluno_id, data_aula);
  end if;
end $$;
