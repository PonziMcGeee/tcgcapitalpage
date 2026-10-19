-- Cartas que admiten trade (intercambio). El vendedor lo marca al subir o editar la carta.
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.
alter table public.listings add column if not exists accepts_trade boolean not null default false;
