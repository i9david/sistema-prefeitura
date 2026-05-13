-- Evolucao de auditoria: vincula logs administrativos ao usuario interno.
-- Mantem usuario_email como campo legado para compatibilidade historica.

alter table public.administrativo_logs
  add column if not exists usuario_id uuid references public.administrativo_usuarios(id) on delete set null;

update public.administrativo_logs logs
set usuario_id = usuarios.id
from public.administrativo_usuarios usuarios
where logs.usuario_id is null
  and logs.usuario_email is not null
  and usuarios.email = logs.usuario_email
  and usuarios.municipio_id = logs.municipio_id;

create index if not exists administrativo_logs_usuario_id_idx
  on public.administrativo_logs (municipio_id, usuario_id, created_at desc);

create index if not exists administrativo_logs_usuario_email_idx
  on public.administrativo_logs (municipio_id, usuario_email, created_at desc)
  where usuario_email is not null;

create index if not exists administrativo_logs_modulo_acao_idx
  on public.administrativo_logs (municipio_id, modulo, acao, created_at desc);
