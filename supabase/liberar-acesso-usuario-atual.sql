create extension if not exists pgcrypto;

do $$
declare
  mineiros_id constant uuid := '30bbd150-57d9-4375-9c09-d9303c7a54c6';
  usuario_auth_id uuid;
  usuario_email text;
  usuario_admin_id uuid;
begin
  select u.id, lower(u.email)
    into usuario_auth_id, usuario_email
  from auth.users u
  where u.id = auth.uid()
     or lower(u.email) = lower(nullif(current_setting('request.jwt.claim.email', true), ''))
  order by
    case when u.id = auth.uid() then 0 else 1 end,
    u.last_sign_in_at desc nulls last,
    u.created_at desc
  limit 1;

  if usuario_auth_id is null then
    select u.id, lower(u.email)
      into usuario_auth_id, usuario_email
    from auth.users u
    where u.email is not null
    order by u.last_sign_in_at desc nulls last, u.created_at desc
    limit 1;
  end if;

  if usuario_auth_id is null or usuario_email is null then
    raise exception 'Nenhum usuario autenticado encontrado em auth.users.';
  end if;

  insert into public.municipios (id, nome, slug, uf, status)
  values (mineiros_id, 'Mineiros', 'mineiros', 'GO', 'ativo')
  on conflict (id) do update
  set
    nome = excluded.nome,
    slug = excluded.slug,
    uf = excluded.uf,
    status = excluded.status,
    updated_at = now();

  select au.id
    into usuario_admin_id
  from public.administrativo_usuarios au
  where au.auth_user_id = usuario_auth_id
     or lower(au.email) = usuario_email
  order by
    case when au.auth_user_id = usuario_auth_id then 0 else 1 end,
    au.created_at desc nulls last
  limit 1;

  if usuario_admin_id is null then
    insert into public.administrativo_usuarios (
      auth_user_id,
      nome,
      email,
      perfil,
      nivel,
      status,
      municipio_id
    )
    values (
      usuario_auth_id,
      coalesce(split_part(usuario_email, '@', 1), 'Usuario'),
      usuario_email,
      'admin',
      'admin',
      'ativo',
      mineiros_id
    )
    returning id into usuario_admin_id;
  else
    update public.administrativo_usuarios
    set
      auth_user_id = coalesce(auth_user_id, usuario_auth_id),
      email = coalesce(email, usuario_email),
      perfil = 'admin',
      nivel = 'admin',
      status = 'ativo',
      municipio_id = mineiros_id
    where id = usuario_admin_id;
  end if;

  create table if not exists public.usuario_municipios (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.administrativo_usuarios(id) on delete cascade,
    municipio_id uuid not null references public.municipios(id) on delete cascade,
    papel text not null default 'admin',
    status text not null default 'ativo',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (usuario_id, municipio_id)
  );

  insert into public.usuario_municipios (
    usuario_id,
    municipio_id,
    papel,
    status
  )
  values (
    usuario_admin_id,
    mineiros_id,
    'admin',
    'ativo'
  )
  on conflict (usuario_id, municipio_id) do update
  set
    papel = excluded.papel,
    status = excluded.status,
    updated_at = now();

  if to_regclass('public.saas_modulos') is not null then
    insert into public.saas_modulos (modulo, nome, ordem, ativo)
    values
      ('centro-cultural', 'Centro Cultural', 10, true),
      ('museu', 'Museu', 20, true),
      ('casa-artesao', 'Casa do Artesao', 30, true),
      ('banda-municipal', 'Banda Municipal', 40, true),
      ('turismo', 'Turismo', 50, true),
      ('administrativo', 'Administrativo', 60, true),
      ('projetos-captacao', 'Projetos de Captacao', 70, true),
      ('biblioteca', 'Biblioteca', 80, true)
    on conflict (modulo) do update
    set
      nome = excluded.nome,
      ordem = excluded.ordem,
      ativo = true;
  end if;

  delete from public.municipio_modulos
  where municipio_id = mineiros_id
    and modulo in (
      'centro-cultural',
      'museu',
      'casa-artesao',
      'banda-municipal',
      'turismo',
      'administrativo',
      'projetos-captacao',
      'biblioteca'
    );

  insert into public.municipio_modulos (
    municipio_id,
    modulo,
    ativo,
    ativado_em,
    desativado_em
  )
  values
    (mineiros_id, 'centro-cultural', true, now(), null),
    (mineiros_id, 'museu', true, now(), null),
    (mineiros_id, 'casa-artesao', true, now(), null),
    (mineiros_id, 'banda-municipal', true, now(), null),
    (mineiros_id, 'turismo', true, now(), null),
    (mineiros_id, 'administrativo', true, now(), null),
    (mineiros_id, 'projetos-captacao', true, now(), null),
    (mineiros_id, 'biblioteca', true, now(), null);

  delete from public.administrativo_acessos
  where usuario_id = usuario_admin_id
    and municipio_id = mineiros_id
    and modulo in (
      'centro-cultural',
      'museu',
      'casa-artesao',
      'banda-municipal',
      'turismo',
      'administrativo',
      'projetos-captacao',
      'biblioteca'
    );

  insert into public.administrativo_acessos (
    usuario_id,
    municipio_id,
    modulo,
    pode_visualizar,
    pode_criar,
    pode_editar,
    pode_excluir
  )
  values
    (usuario_admin_id, mineiros_id, 'centro-cultural', true, true, true, true),
    (usuario_admin_id, mineiros_id, 'museu', true, true, true, true),
    (usuario_admin_id, mineiros_id, 'casa-artesao', true, true, true, true),
    (usuario_admin_id, mineiros_id, 'banda-municipal', true, true, true, true),
    (usuario_admin_id, mineiros_id, 'turismo', true, true, true, true),
    (usuario_admin_id, mineiros_id, 'administrativo', true, true, true, true),
    (usuario_admin_id, mineiros_id, 'projetos-captacao', true, true, true, true),
    (usuario_admin_id, mineiros_id, 'biblioteca', true, true, true, true);

  if to_regclass('public.administrativo_permissoes') is not null then
    delete from public.administrativo_permissoes
    where usuario_id = usuario_admin_id
      and modulo in (
        'Centro Cultural',
        'Biblioteca',
        'Casa do Artesao',
        'Casa do Artesão',
        'Banda Municipal',
        'Administrativo',
        'Turismo',
        'Museu',
        'Projetos de Captacao',
        'Projetos de Captação'
      );

    insert into public.administrativo_permissoes (
      usuario_id,
      modulo,
      area,
      pode_visualizar,
      pode_criar,
      pode_editar,
      pode_excluir
    )
    values
      (usuario_admin_id, 'Centro Cultural', 'Alunos', true, true, true, true),
      (usuario_admin_id, 'Centro Cultural', 'Aulas', true, true, true, true),
      (usuario_admin_id, 'Centro Cultural', 'Professores', true, true, true, true),
      (usuario_admin_id, 'Centro Cultural', 'Frequencia', true, true, true, true),
      (usuario_admin_id, 'Centro Cultural', 'Visitantes', true, true, true, true),
      (usuario_admin_id, 'Biblioteca', 'Leitores', true, true, true, true),
      (usuario_admin_id, 'Biblioteca', 'Livros', true, true, true, true),
      (usuario_admin_id, 'Biblioteca', 'Emprestimos', true, true, true, true),
      (usuario_admin_id, 'Casa do Artesao', 'Artesaos', true, true, true, true),
      (usuario_admin_id, 'Casa do Artesao', 'Produtos', true, true, true, true),
      (usuario_admin_id, 'Casa do Artesao', 'Estoque', true, true, true, true),
      (usuario_admin_id, 'Banda Municipal', 'Musicos', true, true, true, true),
      (usuario_admin_id, 'Banda Municipal', 'Instrumentos', true, true, true, true),
      (usuario_admin_id, 'Banda Municipal', 'Ensaios', true, true, true, true),
      (usuario_admin_id, 'Banda Municipal', 'Apresentacoes', true, true, true, true),
      (usuario_admin_id, 'Administrativo', 'Agenda Institucional', true, true, true, true),
      (usuario_admin_id, 'Administrativo', 'Usuarios e Acessos', true, true, true, true),
      (usuario_admin_id, 'Administrativo', 'Relatorios Gerais', true, true, true, true),
      (usuario_admin_id, 'Turismo', 'Pontos', true, true, true, true),
      (usuario_admin_id, 'Turismo', 'Demandas', true, true, true, true),
      (usuario_admin_id, 'Turismo', 'Visitantes', true, true, true, true),
      (usuario_admin_id, 'Museu', 'Acervo', true, true, true, true),
      (usuario_admin_id, 'Museu', 'Categorias', true, true, true, true),
      (usuario_admin_id, 'Museu', 'Movimentacoes', true, true, true, true),
      (usuario_admin_id, 'Projetos de Captacao', 'Projetos', true, true, true, true),
      (usuario_admin_id, 'Projetos de Captacao', 'Fontes', true, true, true, true),
      (usuario_admin_id, 'Projetos de Captacao', 'Oportunidades', true, true, true, true),
      (usuario_admin_id, 'Projetos de Captacao', 'Analises', true, true, true, true),
      (usuario_admin_id, 'Projetos de Captacao', 'Matching', true, true, true, true),
      (usuario_admin_id, 'Projetos de Captacao', 'Radar', true, true, true, true);
  end if;

  raise notice 'Acessos completos liberados para % no municipio Mineiros.', usuario_email;
end $$;
