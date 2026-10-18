-- Miniaturas de las cartas (reducen mucho el tráfico de fotos).
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.
alter table public.listings add column if not exists thumb_url text;
