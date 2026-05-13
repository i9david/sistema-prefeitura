create or replace function public.usuario_tem_acesso_municipio(target_municipio_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuario_municipios um
    join public.administrativo_usuarios u on u.id = um.usuario_id
    where um.municipio_id = target_municipio_id
      and um.status = 'ativo'
      and u.status = 'ativo'
      and (
        u.auth_user_id = auth.uid()
        or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

create or replace function public.usuario_papel_municipio(target_municipio_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select um.papel
  from public.usuario_municipios um
  join public.administrativo_usuarios u on u.id = um.usuario_id
  where um.municipio_id = target_municipio_id
    and um.status = 'ativo'
    and u.status = 'ativo'
    and (
      u.auth_user_id = auth.uid()
      or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  order by um.created_at asc
  limit 1;
$$;

grant execute on function public.usuario_tem_acesso_municipio(uuid) to authenticated;
grant execute on function public.usuario_papel_municipio(uuid) to authenticated;

alter table public.municipios enable row level security;
alter table public.usuario_municipios enable row level security;

drop policy if exists municipios_select_por_vinculo on public.municipios;
create policy municipios_select_por_vinculo
on public.municipios
for select
to authenticated
using (
  public.usuario_tem_acesso_municipio(id)
  or slug = 'municipio-padrao'
);

drop policy if exists usuario_municipios_select_proprio on public.usuario_municipios;
create policy usuario_municipios_select_proprio
on public.usuario_municipios
for select
to authenticated
using (
  exists (
    select 1
    from public.administrativo_usuarios u
    where u.id = usuario_municipios.usuario_id
      and u.status = 'ativo'
      and (
        u.auth_user_id = auth.uid()
        or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists usuario_municipios_insert_admin_service on public.usuario_municipios;
create policy usuario_municipios_insert_admin_service
on public.usuario_municipios
for insert
to authenticated
with check (false);

drop policy if exists usuario_municipios_update_admin_service on public.usuario_municipios;
create policy usuario_municipios_update_admin_service
on public.usuario_municipios
for update
to authenticated
using (false)
with check (false);

drop policy if exists usuario_municipios_delete_admin_service on public.usuario_municipios;
create policy usuario_municipios_delete_admin_service
on public.usuario_municipios
for delete
to authenticated
using (false);

do $$
declare
  tabela text;
  tabelas text[] := array[
    'pessoas',
    'alunos',
    'professores',
    'modalidades',
    'aulas',
    'aula_professores',
    'modalidade_professores',
    'frequencias',
    'aluno_biometrias',
    'visitantes',
    'biblioteca_leitores',
    'biblioteca_emprestimos',
    'museu_visitantes',
    'museu_categorias',
    'museu_acervo',
    'museu_movimentacoes',
    'casa_artesao_artesaos',
    'casa_artesao_produtos',
    'casa_artesao_estoque_movimentacoes',
    'casa_artesao_vendas',
    'casa_artesao_venda_itens',
    'casa_artesao_fechamentos',
    'casa_artesao_configuracoes',
    'banda_municipal_musicos',
    'banda_municipal_instrumentos',
    'banda_municipal_ensaios',
    'banda_municipal_ensaio_presencas',
    'banda_municipal_apresentacoes',
    'banda_municipal_apresentacao_participantes',
    'banda_municipal_apresentacao_musicos',
    'turismo_pontos',
    'turismo_demandas',
    'turismo_visitantes',
    'captacao_fontes',
    'captacao_oportunidades',
    'captacao_projetos',
    'captacao_analises',
    'captacao_matching',
    'captacao_ia_historico',
    'captacao_radar_fontes',
    'captacao_radar_capturas',
    'administrativo_configuracoes',
    'comunicacoes',
    'administrativo_logs',
    'auditoria_logs'
  ];
begin
  foreach tabela in array tabelas loop
    if to_regclass('public.' || tabela) is not null then
      execute format('alter table public.%I enable row level security', tabela);

      execute format(
        'drop policy if exists tenant_isolation_select on public.%I',
        tabela
      );

      execute format(
        'create policy tenant_isolation_select on public.%I for select to authenticated using (public.usuario_tem_acesso_municipio(municipio_id))',
        tabela
      );

      execute format(
        'drop policy if exists tenant_isolation_insert on public.%I',
        tabela
      );

      execute format(
        'create policy tenant_isolation_insert on public.%I for insert to authenticated with check (public.usuario_tem_acesso_municipio(municipio_id))',
        tabela
      );

      execute format(
        'drop policy if exists tenant_isolation_update on public.%I',
        tabela
      );

      execute format(
        'create policy tenant_isolation_update on public.%I for update to authenticated using (public.usuario_tem_acesso_municipio(municipio_id)) with check (public.usuario_tem_acesso_municipio(municipio_id))',
        tabela
      );

      execute format(
        'drop policy if exists tenant_isolation_delete on public.%I',
        tabela
      );

      execute format(
        'create policy tenant_isolation_delete on public.%I for delete to authenticated using (public.usuario_tem_acesso_municipio(municipio_id))',
        tabela
      );
    end if;
  end loop;
end $$;

comment on function public.usuario_tem_acesso_municipio(uuid)
is 'RLS multi-tenant: permite acesso quando o usuário autenticado tem vínculo ativo com o município informado.';

comment on function public.usuario_papel_municipio(uuid)
is 'RLS multi-tenant: retorna o papel do usuário autenticado no município informado.';
