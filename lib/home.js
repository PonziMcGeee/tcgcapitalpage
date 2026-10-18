// Datos de la portada: banners del slider y carruseles elegidos por el administrador.
// Si todavía no se ha ejecutado la migración, devuelve listas vacías y la portada usa su diseño por defecto.
export async function fetchHome(sb) {
  const [bannersRes, collectionsRes, featuredRes] = await Promise.all([
    sb.from('home_banners').select('*').eq('active', true).order('position', { ascending: true }),
    sb
      .from('home_collections')
      .select('*, items:home_collection_items(*)')
      .eq('active', true)
      .order('position', { ascending: true }),
    sb.from('home_featured_sellers').select('*').order('position', { ascending: true }),
  ]);

  const banners = bannersRes.error ? [] : bannersRes.data;
  const rawCollections = collectionsRes.error ? [] : collectionsRes.data;
  const rawFeatured = featuredRes.error ? [] : featuredRes.data;

  // Se piden de una vez todas las cartas y vendedores que salen en algún carrusel
  const listingIds = new Set();
  const sellerIds = new Set();
  rawCollections.forEach((c) =>
    c.items.forEach((it) => {
      if (it.listing_id) listingIds.add(it.listing_id);
      if (it.seller_id) sellerIds.add(it.seller_id);
    })
  );

  rawFeatured.forEach((f) => sellerIds.add(f.seller_id));

  const listingsRes = listingIds.size
    ? await sb.from('listings').select('*').in('id', [...listingIds])
    : { data: [] };
  const listings = listingsRes.data || [];
  listings.forEach((l) => sellerIds.add(l.seller_id));

  const sellersRes = sellerIds.size
    ? await sb.from('sellers_public').select('*').in('id', [...sellerIds])
    : { data: [] };
  const sellers = sellersRes.data || [];

  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const sellerMap = new Map(sellers.map((s) => [s.id, s]));

  const collections = rawCollections
    .map((c) => {
      const items = [...c.items].sort((a, b) => a.position - b.position);
      return {
        ...c,
        cards: items.map((it) => listingMap.get(it.listing_id)).filter(Boolean),
        sellers: items.map((it) => sellerMap.get(it.seller_id)).filter(Boolean),
      };
    })
    .filter((c) => (c.kind === 'sellers' ? c.sellers.length > 0 : c.cards.length > 0));

  const featured = rawFeatured
    .map((f) => ({ seller: sellerMap.get(f.seller_id), label: f.label }))
    .filter((f) => f.seller);

  return { banners, collections, sellerMap, featured };
}
