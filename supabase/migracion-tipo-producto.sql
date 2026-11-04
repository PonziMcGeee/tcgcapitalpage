-- Tipo de producto: suelta (carta suelta), slab o sellado.
-- Antes «Slabs» y «Sellado» eran una colección; ahora son un tipo y además se puede elegir la colección.
-- Se puede ejecutar varias veces sin problema.
alter table public.listings add column if not exists product_type text;
alter table public.listings drop constraint if exists listings_product_type_check;

-- 1) Los anuncios antiguos con «Slabs» o «Sellado» como colección pasan al tipo nuevo
--    (su colección queda sin indicar; el vendedor puede editarla)
update public.listings set product_type = 'slab', collection = null where collection = 'Slabs';
update public.listings set product_type = 'sellado', collection = null where collection = 'Sellado';

-- 2) Todo lo demás son cartas sueltas
update public.listings set product_type = 'suelta' where product_type is null or product_type = '';

-- 3) A partir de ahora, todo anuncio nuevo es «suelta» salvo que se indique otra cosa
alter table public.listings alter column product_type set default 'suelta';
alter table public.listings alter column product_type set not null;
alter table public.listings add constraint listings_product_type_check check (product_type in ('suelta', 'slab', 'sellado'));
