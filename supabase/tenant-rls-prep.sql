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

comment on function public.usuario_tem_acesso_municipio(uuid)
is 'Preparação para RLS multi-tenant. Retorna true quando o usuário autenticado tem vínculo ativo com o município informado.';

comment on function public.usuario_papel_municipio(uuid)
is 'Preparação para RLS multi-tenant. Retorna o papel do usuário autenticado no município informado.';

-- Fase futura:
-- alter table public.alunos enable row level security;
-- create policy "tenant_select_alunos"
-- on public.alunos
-- for select
-- using (public.usuario_tem_acesso_municipio(municipio_id));
--
-- create policy "tenant_write_alunos"
-- on public.alunos
-- for all
-- using (public.usuario_tem_acesso_municipio(municipio_id))
-- with check (public.usuario_tem_acesso_municipio(municipio_id));
