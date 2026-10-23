-- Orden que elige cada vendedor para sus cartas (menor número = sale antes).
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.
alter table public.listings add column if not exists sort_order integer;
