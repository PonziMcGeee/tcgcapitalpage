-- Foto de perfil de los vendedores.
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.
alter table public.profiles add column if not exists avatar_url text;

-- La lista pública de vendedores incluye ahora la foto
create or replace view public.sellers_public as
select
  p.id,
  p.display_name,
  p.color,
  (
    select count(*)
    from public.listings l
    where l.seller_id = p.id and l.status = 'available'
  )::int as cards_available,
  p.avatar_url
from public.profiles p
where p.role in ('seller', 'admin');

grant select on public.sellers_public to anon, authenticated;
