-- Colección de cada carta (solo se usa en Pokémon).
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.
alter table public.listings add column if not exists collection text;
