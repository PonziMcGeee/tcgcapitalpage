-- Favoritos: cada comprador guarda cartas y vendedores (perfiles) para verlos antes.
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('card', 'seller')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, target_id)
);

alter table public.favorites enable row level security;

drop policy if exists "ver mis favoritos" on public.favorites;
create policy "ver mis favoritos" on public.favorites
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "añadir mis favoritos" on public.favorites;
create policy "añadir mis favoritos" on public.favorites
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "quitar mis favoritos" on public.favorites;
create policy "quitar mis favoritos" on public.favorites
  for delete to authenticated using (user_id = auth.uid());
