-- Moderación: el administrador puede borrar cualquier carta (y sus fotos),
-- y las cartas de quien deja de ser vendedor dejan de verse en la web.
-- Ejecútalo una sola vez en Supabase > SQL Editor > New query > Run.

-- ¿Sigue siendo vendedor (o administrador) esta persona?
create or replace function public.es_vendedor_activo(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role in ('seller', 'admin'));
$$;

-- Ver cartas: las de vendedores activos; el dueño ve las suyas y el administrador todas
drop policy if exists "ver cartas" on public.listings;
create policy "ver cartas" on public.listings
  for select using (
    public.es_vendedor_activo(seller_id) or seller_id = auth.uid() or public.is_admin()
  );

-- El administrador puede borrar cualquier carta
drop policy if exists "admin borra cartas" on public.listings;
create policy "admin borra cartas" on public.listings
  for delete to authenticated
  using (public.is_admin());

-- ...y las fotos de cualquier vendedor
drop policy if exists "admin borra fotos de cartas" on storage.objects;
create policy "admin borra fotos de cartas" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cards' and public.is_admin());
