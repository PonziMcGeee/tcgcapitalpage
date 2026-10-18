-- Vendedores destacados de la portada (hasta 2, elegidos a mano por el administrador).
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.
create table if not exists public.home_featured_sellers (
  id uuid primary key default gen_random_uuid(),
  position int not null unique check (position in (1, 2)),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  created_at timestamptz not null default now()
);

alter table public.home_featured_sellers enable row level security;

drop policy if exists "ver destacados" on public.home_featured_sellers;
create policy "ver destacados" on public.home_featured_sellers
  for select using (true);

drop policy if exists "admin gestiona destacados" on public.home_featured_sellers;
create policy "admin gestiona destacados" on public.home_featured_sellers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
