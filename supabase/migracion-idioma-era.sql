-- Idioma y era de las cartas de Pokémon (el set depende de las dos cosas).
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.
alter table public.listings add column if not exists language text check (language in ('es', 'en', 'ja', 'zh'));
alter table public.listings add column if not exists era text check (era in ('vintage', 'media', 'moderno'));

-- Las cartas antiguas solo tenían colecciones japonesas, así que se marcan como japonesas
update public.listings
set language = 'ja'
where game = 'Pokémon' and collection is not null and collection <> 'Lote' and language is null;
