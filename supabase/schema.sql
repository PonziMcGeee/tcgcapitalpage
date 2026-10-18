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
