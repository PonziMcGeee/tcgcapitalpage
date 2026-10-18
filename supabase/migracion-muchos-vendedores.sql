-- TCG Capital Page · Migración para muchos vendedores
-- Si ya ejecutaste schema.sql antes, pega SOLO este archivo en Supabase > SQL Editor > Run.
-- (Si montas el proyecto desde cero, ya viene incluido al final de schema.sql.)

-- 1) Cada vendedor puede elegir el color de su tienda
alter table public.profiles add column if not exists color text;

-- 2) Lista pública de vendedores (solo nombre, color y nº de cartas; nunca el contacto)
create or replace view public.sellers_public as
select
  p.id,
  p.display_name,
  p.color,
  (
    select count(*)
    from public.listings l
    where l.seller_id = p.id and l.status = 'available'
  )::int as cards_available
from public.profiles p
where p.role = 'seller';

grant select on public.sellers_public to anon, authenticated;

-- 3) Si un vendedor cambia su nombre, se actualiza en todas sus cartas
create or replace function public.sincronizar_nombre_vendedor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.display_name is distinct from old.display_name then
    update public.listings set seller_name = new.display_name where seller_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sincronizar_nombre_vendedor on public.profiles;
create trigger sincronizar_nombre_vendedor
  after update on public.profiles
  for each row execute function public.sincronizar_nombre_vendedor();
