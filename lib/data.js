// Supabase devuelve como máximo 1000 filas por consulta, así que se pide por páginas.
const PAGE = 1000;

export async function fetchAllAvailable(sb) {
  let all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('listings')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) return { data: null, error };
    all = all.concat(data);
    if (data.length < PAGE) break;
  }
  return { data: all, error: null };
}

// Lista pública de vendedores (vista sellers_public): id, display_name, color, cards_available
export function fetchSellers(sb) {
  return sb.from('sellers_public').select('*').order('display_name', { ascending: true });
}

// Nota media de cada vendedor (vista seller_ratings). Devuelve un Map id -> { average, total }.
// Si todavía no se ha ejecutado la migración de reseñas, devuelve un Map vacío.
export async function fetchRatings(sb) {
  const { data, error } = await sb.from('seller_ratings').select('seller_id, average, total');
  if (error || !data) return new Map();
  return new Map(data.map((r) => [r.seller_id, { average: Number(r.average), total: r.total }]));
}

// Plan B si todavía no se ha ejecutado la migración: se sacan los vendedores de las cartas
export function deriveSellers(listings) {
  const map = new Map();
  listings.forEach((l) => {
    const s = map.get(l.seller_id) || { id: l.seller_id, display_name: l.seller_name, color: null, cards_available: 0 };
    s.cards_available += 1;
    map.set(l.seller_id, s);
  });
  return [...map.values()].sort((a, b) => a.display_name.localeCompare(b.display_name));
}
