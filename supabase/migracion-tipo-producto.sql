-- Tipo de producto: carta suelta (vacío), slab o sellado.
-- Antes «Slabs» y «Sellado» eran una colección; ahora son un tipo y además se puede elegir la colección.
alter table public.listings add column if not exists product_type text;
alter table public.listings drop constraint if exists listings_product_type_check;
alter table public.listings add constraint listings_product_type_check check (product_type in ('slab', 'sellado'));

-- Pasa los anuncios antiguos al nuevo formato (su colección queda sin indicar; el vendedor puede editarla)
update public.listings set product_type = 'slab', collection = null where collection = 'Slabs';
update public.listings set product_type = 'sellado', collection = null where collection = 'Sellado';
