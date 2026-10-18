-- TCG Capital Page · esquema de base de datos
-- Pégalo entero en Supabase > SQL Editor > New query > Run

-- ============ PERFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'buyer' check (role in ('buyer', 'seller')),
  display_name text,
  phone text,
  telegram text,
  instagram text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Función auxiliar: ¿el usuario actual es vendedor?
create or replace function public.is_seller()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'seller'
  );
$$;

-- Los usuarios registrados ven los perfiles de vendedores (para el contacto) y el suyo propio
drop policy if exists "ver perfiles" on public.profiles;
create policy "ver perfiles" on public.profiles
  for select to authenticated
  using (role = 'seller' or id = auth.uid());

drop policy if exists "editar mi perfil" on public.profiles;
create policy "editar mi perfil" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Nadie puede cambiarse el rol desde la web (solo tú desde el SQL Editor)
create or replace function public.bloquear_cambio_de_rol()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'No puedes cambiar el rol desde la web';
  end if;
  return new;
end;
$$;

drop trigger if exists bloquear_cambio_de_rol on public.profiles;
create trigger bloquear_cambio_de_rol
  before update on public.profiles
  for each row execute function public.bloquear_cambio_de_rol();

-- Al registrarse alguien se crea su perfil como comprador
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- ============ CARTAS EN VENTA ============
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  seller_name text not null,
  name text not null,
  game text not null default 'Pokémon',
  condition text not null default 'NM',
  description text,
  price numeric(10,2) not null check (price >= 0),
  shipping_spain numeric(10,2) not null default 0 check (shipping_spain >= 0),
  shipping_europe numeric(10,2) not null default 0 check (shipping_europe >= 0),
  front_url text not null,
  back_url text,
  status text not null default 'available' check (status in ('available', 'sold')),
  created_at timestamptz not null default now()
);

create index if not exists listings_status_idx on public.listings (status, created_at desc);
create index if not exists listings_seller_idx on public.listings (seller_id);

alter table public.listings enable row level security;

-- El catálogo lo puede ver cualquiera
drop policy if exists "ver cartas" on public.listings;
create policy "ver cartas" on public.listings
  for select using (true);

-- Solo vendedores publican, y solo a su nombre
drop policy if exists "vendedor publica" on public.listings;
create policy "vendedor publica" on public.listings
  for insert to authenticated
  with check (seller_id = auth.uid() and public.is_seller());

-- Cada vendedor solo toca sus propias cartas
drop policy if exists "vendedor edita lo suyo" on public.listings;
create policy "vendedor edita lo suyo" on public.listings
  for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

drop policy if exists "vendedor borra lo suyo" on public.listings;
create policy "vendedor borra lo suyo" on public.listings
  for delete to authenticated
  using (seller_id = auth.uid());

-- ============ FOTOS ============
insert into storage.buckets (id, name, public)
values ('cards', 'cards', true)
on conflict (id) do nothing;

drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas" on storage.objects
  for select using (bucket_id = 'cards');

-- Cada vendedor sube a su propia carpeta (carpeta = su id de usuario)
drop policy if exists "vendedor sube fotos" on storage.objects;
create policy "vendedor sube fotos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cards'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_seller()
  );

drop policy if exists "vendedor borra sus fotos" on storage.objects;
create policy "vendedor borra sus fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cards' and (storage.foldername(name))[1] = auth.uid()::text);


-- ============ MUCHOS VENDEDORES (color, lista pública, sincronizar nombre) ============
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


-- ============ ADMINISTRADOR, BANNERS Y CARRUSELES ============
-- 1) Nuevo rol: administrador (también cuenta como vendedor)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('buyer', 'seller', 'admin'));

create or replace function public.is_seller()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('seller', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- El administrador ve todos los perfiles; el resto, solo vendedores/admin y el suyo
drop policy if exists "ver perfiles" on public.profiles;
create policy "ver perfiles" on public.profiles
  for select to authenticated
  using (role in ('seller', 'admin') or id = auth.uid() or public.is_admin());

drop policy if exists "admin edita perfiles" on public.profiles;
create policy "admin edita perfiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Cambios de rol: solo un administrador puede pasar a alguien de comprador a vendedor
-- (y al revés). Nadie puede cambiar su propio rol ni tocar a otro administrador.
-- El rol "admin" solo se da desde el SQL Editor.
create or replace function public.bloquear_cambio_de_rol()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    if not (
      public.is_admin()
      and old.id <> auth.uid()
      and old.role in ('buyer', 'seller')
      and new.role in ('buyer', 'seller')
    ) then
      raise exception 'No puedes cambiar ese rol desde la web';
    end if;
  end if;
  return new;
end;
$$;

-- Los administradores aparecen también como vendedores
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
where p.role in ('seller', 'admin');

grant select on public.sellers_public to anon, authenticated;

-- Lista de usuarios con su email (solo para administradores)
create or replace function public.admin_list_users()
returns table (id uuid, email text, display_name text, role text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.role, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- 2) Banners de la portada (el slider de arriba)
create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text,
  subtitle text,
  button_text text,
  link_url text,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.home_banners enable row level security;

drop policy if exists "ver banners" on public.home_banners;
create policy "ver banners" on public.home_banners
  for select using (active or public.is_admin());

drop policy if exists "admin gestiona banners" on public.home_banners;
create policy "admin gestiona banners" on public.home_banners
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3) Carruseles de la portada: cada uno tiene título y, o cartas, o vendedores elegidos a mano
create table if not exists public.home_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  kind text not null default 'cards' check (kind in ('cards', 'sellers')),
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.home_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.home_collections(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete cascade,
  position int not null default 0,
  check (
    (listing_id is not null and seller_id is null)
    or (listing_id is null and seller_id is not null)
  ),
  unique (collection_id, listing_id),
  unique (collection_id, seller_id)
);

create index if not exists home_collection_items_idx on public.home_collection_items (collection_id, position);

alter table public.home_collections enable row level security;
alter table public.home_collection_items enable row level security;

drop policy if exists "ver carruseles" on public.home_collections;
create policy "ver carruseles" on public.home_collections
  for select using (active or public.is_admin());

drop policy if exists "admin gestiona carruseles" on public.home_collections;
create policy "admin gestiona carruseles" on public.home_collections
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "ver elementos de carruseles" on public.home_collection_items;
create policy "ver elementos de carruseles" on public.home_collection_items
  for select using (true);

drop policy if exists "admin gestiona elementos" on public.home_collection_items;
create policy "admin gestiona elementos" on public.home_collection_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4) Imágenes de los banners (solo el administrador sube y borra)
insert into storage.buckets (id, name, public)
values ('site', 'site', true)
on conflict (id) do nothing;

drop policy if exists "site publico" on storage.objects;
create policy "site publico" on storage.objects
  for select using (bucket_id = 'site');

drop policy if exists "admin sube a site" on storage.objects;
create policy "admin sube a site" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site' and public.is_admin());

drop policy if exists "admin borra de site" on storage.objects;
create policy "admin borra de site" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site' and public.is_admin());

-- 5) Hazte administrador (cambia el email por el tuyo y ejecuta SOLO esto):
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'tu-email@ejemplo.com');
