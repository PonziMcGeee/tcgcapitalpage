-- Ventas con comprador y reseñas de vendedores.
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.

-- 1) Ventas: a quién vendió el vendedor cada carta (solo lo ven el vendedor, el comprador y el admin)
create table if not exists public.sales (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  buyer_name text,
  seller_name text,
  listing_name text,
  created_at timestamptz not null default now()
);

alter table public.sales enable row level security;

drop policy if exists "ver mis ventas y compras" on public.sales;
create policy "ver mis ventas y compras" on public.sales
  for select to authenticated
  using (seller_id = auth.uid() or buyer_id = auth.uid() or public.is_admin());

drop policy if exists "vendedor registra venta" on public.sales;
create policy "vendedor registra venta" on public.sales
  for insert to authenticated
  with check (
    seller_id = auth.uid()
    and buyer_id <> auth.uid()
    and exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

drop policy if exists "vendedor cambia venta" on public.sales;
create policy "vendedor cambia venta" on public.sales
  for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid() and buyer_id <> auth.uid());

drop policy if exists "vendedor o admin borra venta" on public.sales;
create policy "vendedor o admin borra venta" on public.sales
  for delete to authenticated
  using (seller_id = auth.uid() or public.is_admin());

-- Rellena los nombres (copia de seguridad) para que se vean aunque cambien o se borre la carta
create or replace function public.sales_rellenar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.buyer_name := coalesce((select display_name from public.profiles where id = new.buyer_id), 'Comprador');
  new.seller_name := coalesce((select display_name from public.profiles where id = new.seller_id), 'Vendedor');
  new.listing_name := coalesce((select name from public.listings where id = new.listing_id), '');
  return new;
end;
$$;

drop trigger if exists sales_rellenar_trg on public.sales;
create trigger sales_rellenar_trg
  before insert or update on public.sales
  for each row execute function public.sales_rellenar();

-- 2) Reseñas: solo las puede escribir el comprador de esa carta; las ve todo el mundo
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid unique references public.listings(id) on delete set null,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  buyer_name text,
  listing_name text,
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "ver reseñas" on public.reviews;
create policy "ver reseñas" on public.reviews
  for select using (true);

drop policy if exists "comprador escribe reseña" on public.reviews;
create policy "comprador escribe reseña" on public.reviews
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.sales s
      where s.listing_id = reviews.listing_id and s.buyer_id = auth.uid() and s.seller_id = reviews.seller_id
    )
  );

drop policy if exists "comprador edita su reseña" on public.reviews;
create policy "comprador edita su reseña" on public.reviews
  for update to authenticated
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

drop policy if exists "comprador o admin borra reseña" on public.reviews;
create policy "comprador o admin borra reseña" on public.reviews
  for delete to authenticated
  using (buyer_id = auth.uid() or public.is_admin());

create or replace function public.reviews_rellenar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    -- Al editar solo cambian la nota y el comentario
    new.listing_id := old.listing_id;
    new.seller_id := old.seller_id;
    new.buyer_id := old.buyer_id;
    new.buyer_name := old.buyer_name;
    new.listing_name := old.listing_name;
    new.created_at := old.created_at;
    new.updated_at := now();
  else
    new.buyer_name := coalesce((select display_name from public.profiles where id = new.buyer_id), 'Comprador');
    new.listing_name := coalesce((select name from public.listings where id = new.listing_id), '');
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_rellenar_trg on public.reviews;
create trigger reviews_rellenar_trg
  before insert or update on public.reviews
  for each row execute function public.reviews_rellenar();

-- 3) Nota media de cada vendedor (pública)
create or replace view public.seller_ratings as
  select seller_id, round(avg(rating)::numeric, 1) as average, count(*)::int as total
  from public.reviews
  group by seller_id;

grant select on public.seller_ratings to anon, authenticated;

-- 4) Búsqueda de compradores para el vendedor (nombre y email parcialmente oculto, nunca el email completo)
create or replace function public.buscar_compradores(q text)
returns table (id uuid, display_name text, email_oculto text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_seller() then
    return;
  end if;
  if q is null or char_length(trim(q)) < 2 then
    return;
  end if;
  return query
    select p.id,
           coalesce(p.display_name, 'Sin nombre'),
           left(u.email, 2) || '***@' || split_part(u.email, '@', 2)
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id <> auth.uid()
      and (p.display_name ilike '%' || trim(q) || '%' or u.email ilike trim(q) || '%')
    order by p.display_name
    limit 8;
end;
$$;

revoke all on function public.buscar_compradores(text) from public, anon;
grant execute on function public.buscar_compradores(text) to authenticated;
