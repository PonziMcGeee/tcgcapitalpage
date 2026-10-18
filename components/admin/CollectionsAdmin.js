'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SellerBadge from '../SellerBadge';
import { fetchSellers } from '../../lib/data';
import { euros } from '../../lib/format';
import { getSupabase } from '../../lib/supabase';

const TIPOS = {
  cards: 'Cartas elegidas por mí',
  sellers: 'Vendedores elegidos por mí',
};

// Buscador para añadir cartas de cualquier vendedor a un carrusel
function CardPicker({ existentes, onAdd }) {
  const [q, setQ] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [sellers, setSellers] = useState([]);
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    fetchSellers(getSupabase()).then(({ data }) => setSellers(data || []));
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const sb = getSupabase();
      let consulta = sb
        .from('listings')
        .select('id, name, front_url, seller_id, seller_name, status, price')
        .order('created_at', { ascending: false })
        .limit(20);
      if (q.trim()) consulta = consulta.ilike('name', `%${q.trim()}%`);
      if (sellerId) consulta = consulta.eq('seller_id', sellerId);
      const { data } = await consulta;
      setResultados(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [q, sellerId]);

  return (
    <div className="picker">
      <div className="filters" style={{ gridTemplateColumns: '2fr 1fr', margin: 0 }}>
        <input type="text" placeholder="Buscar carta por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
          <option value="">Todos los vendedores</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
      </div>
      <div className="picker-results">
        {resultados.length === 0 && <p className="muted small">No hay cartas con ese filtro.</p>}
        {resultados.map((l) => (
          <div className="picker-row" key={l.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.front_url} alt="" />
            <div className="grow">
              <strong>{l.name}</strong>
              <p className="muted small">
                {l.seller_name} · {euros(l.price)}
                {l.status === 'sold' ? ' · vendida' : ''}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-small"
              disabled={existentes.has(l.id)}
              onClick={() => onAdd(l.id)}
            >
              {existentes.has(l.id) ? 'Añadida' : 'Añadir'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Buscador para añadir vendedores a un carrusel
function SellerPicker({ existentes, onAdd }) {
  const [q, setQ] = useState('');
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    fetchSellers(getSupabase()).then(({ data }) => setSellers(data || []));
  }, []);

  const lista = sellers.filter((s) => !q.trim() || s.display_name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="picker">
      <input type="text" placeholder="Buscar vendedor…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="picker-results">
        {lista.slice(0, 20).map((s) => (
          <div className="picker-row" key={s.id}>
            <SellerBadge id={s.id} name={s.display_name} color={s.color} size={32} />
            <div className="grow">
              <strong>{s.display_name}</strong>
              <p className="muted small">{s.cards_available} cartas en venta</p>
            </div>
            <button
              type="button"
              className="btn btn-small"
              disabled={existentes.has(s.id)}
              onClick={() => onAdd(s.id)}
            >
              {existentes.has(s.id) ? 'Añadido' : 'Añadir'}
            </button>
          </div>
        ))}
        {lista.length === 0 && <p className="muted small">No hay vendedores con ese nombre.</p>}
      </div>
    </div>
  );
}

// Editor de los carruseles de la portada: crear, ordenar y llenarlos con lo que quiera el administrador.
export default function CollectionsAdmin() {
  const [colecciones, setColecciones] = useState([]);
  const [listingMap, setListingMap] = useState(new Map());
  const [sellerMap, setSellerMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('cards');
  const [abierto, setAbierto] = useState(null); // carrusel con el buscador abierto

  const cargar = useCallback(async () => {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('home_collections')
      .select('*, items:home_collection_items(*)')
      .order('position', { ascending: true });
    if (error) {
      setMsg({ type: 'error', text: 'No se han podido cargar los carruseles. ¿Has ejecutado la migración?' });
      setLoading(false);
      return;
    }
    const lista = data.map((c) => ({ ...c, items: [...c.items].sort((a, b) => a.position - b.position) }));

    const listingIds = [...new Set(lista.flatMap((c) => c.items.map((i) => i.listing_id).filter(Boolean)))];
    const sellerIds = [...new Set(lista.flatMap((c) => c.items.map((i) => i.seller_id).filter(Boolean)))];
    const [listings, sellers] = await Promise.all([
      listingIds.length
        ? sb.from('listings').select('id, name, front_url, seller_name, status').in('id', listingIds)
        : { data: [] },
      sellerIds.length ? sb.from('sellers_public').select('*').in('id', sellerIds) : { data: [] },
    ]);
    setListingMap(new Map((listings.data || []).map((l) => [l.id, l])));
    setSellerMap(new Map((sellers.data || []).map((s) => [s.id, s])));
    setColecciones(lista);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(e) {
    e.preventDefault();
    if (!titulo.trim()) return;
    const sb = getSupabase();
    const { error } = await sb.from('home_collections').insert({
      title: titulo.trim(),
      kind: tipo,
      position: colecciones.reduce((m, c) => Math.max(m, c.position), 0) + 1,
    });
    if (error) {
      setMsg({ type: 'error', text: 'No se ha podido crear el carrusel.' });
      return;
    }
    setTitulo('');
    setMsg({ type: 'ok', text: 'Carrusel creado. Añádele cartas o vendedores.' });
    cargar();
  }

  async function renombrar(c, nuevo) {
    const limpio = nuevo.trim();
    if (!limpio || limpio === c.title) return;
    await getSupabase().from('home_collections').update({ title: limpio }).eq('id', c.id);
    cargar();
  }

  async function alternarActivo(c) {
    await getSupabase().from('home_collections').update({ active: !c.active }).eq('id', c.id);
    cargar();
  }

  async function moverColeccion(indice, direccion) {
    const sb = getSupabase();
    const a = colecciones[indice];
    const b = colecciones[indice + direccion];
    if (!a || !b) return;
    await Promise.all([
      sb.from('home_collections').update({ position: b.position }).eq('id', a.id),
      sb.from('home_collections').update({ position: a.position }).eq('id', b.id),
    ]);
    cargar();
  }

  async function borrarColeccion(c) {
    if (!window.confirm(`¿Borrar el carrusel "${c.title}"?`)) return;
    await getSupabase().from('home_collections').delete().eq('id', c.id);
    cargar();
  }

  async function anadir(c, id) {
    const campo = c.kind === 'sellers' ? 'seller_id' : 'listing_id';
    const { error } = await getSupabase()
      .from('home_collection_items')
      .insert({
        collection_id: c.id,
        [campo]: id,
        position: c.items.reduce((m, i) => Math.max(m, i.position), 0) + 1,
      });
    if (error) setMsg({ type: 'error', text: 'No se ha podido añadir.' });
    cargar();
  }

  async function quitar(item) {
    await getSupabase().from('home_collection_items').delete().eq('id', item.id);
    cargar();
  }

  async function moverItem(c, indice, direccion) {
    const sb = getSupabase();
    const a = c.items[indice];
    const b = c.items[indice + direccion];
    if (!a || !b) return;
    await Promise.all([
      sb.from('home_collection_items').update({ position: b.position }).eq('id', a.id),
      sb.from('home_collection_items').update({ position: a.position }).eq('id', b.id),
    ]);
    cargar();
  }

  const nombresEnUso = useMemo(() => colecciones.length, [colecciones]);

  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>
        Son las filas deslizables de la portada, debajo de los banners. Crea las que quieras ("Mejores cartas", "Mejores
        vendedores"…) y elige a mano qué sale en cada una, con cartas de cualquier vendedor.
      </p>

      {msg && <div className={`notice ${msg.type === 'ok' ? 'notice-ok' : 'notice-error'}`}>{msg.text}</div>}

      <form className="panel" onSubmit={crear}>
        <h2>Nuevo carrusel</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="col-titulo">Título</label>
            <input
              id="col-titulo"
              type="text"
              placeholder="Ej: Mejores cartas del mes"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="col-tipo">Qué lleva dentro</label>
            <select id="col-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {Object.entries(TIPOS).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn" style={{ marginTop: 12 }}>
          Crear carrusel
        </button>
      </form>

      {loading && <p className="muted">Cargando…</p>}
      {!loading && nombresEnUso === 0 && (
        <div className="empty">
          Todavía no hay carruseles. Mientras tanto, la portada enseña las últimas cartas añadidas.
        </div>
      )}

      {colecciones.map((c, i) => {
        const existentes = new Set(c.items.map((it) => it.listing_id || it.seller_id));
        return (
          <section className="collection-box" key={c.id}>
            <div className="collection-head">
              <input type="text" defaultValue={c.title} onBlur={(e) => renombrar(c, e.target.value)} />
              <span className="role-tag">{c.kind === 'sellers' ? 'Vendedores' : 'Cartas'}</span>
              <div className="admin-actions">
                <label>
                  <input type="checkbox" checked={c.active} onChange={() => alternarActivo(c)} />
                  Visible
                </label>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === 0}
                  onClick={() => moverColeccion(i, -1)}
                  aria-label="Subir carrusel"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === colecciones.length - 1}
                  onClick={() => moverColeccion(i, 1)}
                  aria-label="Bajar carrusel"
                >
                  ↓
                </button>
                <button type="button" className="btn btn-small btn-danger" onClick={() => borrarColeccion(c)}>
                  Borrar
                </button>
              </div>
            </div>

            {c.items.length === 0 && <p className="muted small">Vacío. Si no tiene nada, no se enseña en la web.</p>}

            <div className="mini-grid">
              {c.items.map((it, idx) => {
                const l = it.listing_id ? listingMap.get(it.listing_id) : null;
                const s = it.seller_id ? sellerMap.get(it.seller_id) : null;
                return (
                  <div className="mini" key={it.id}>
                    {l && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.front_url} alt={l.name} />
                    )}
                    {s && (
                      <div style={{ display: 'grid', placeItems: 'center', padding: '10px 0' }}>
                        <SellerBadge id={s.id} name={s.display_name} color={s.color} size={48} />
                      </div>
                    )}
                    <strong>{l ? l.name : s?.display_name}</strong>
                    {l && <span className="muted">{l.seller_name}{l.status === 'sold' ? ' · vendida' : ''}</span>}
                    <div className="mini-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={idx === 0}
                        onClick={() => moverItem(c, idx, -1)}
                        aria-label="Mover antes"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={idx === c.items.length - 1}
                        onClick={() => moverItem(c, idx, 1)}
                        aria-label="Mover después"
                      >
                        →
                      </button>
                      <button type="button" className="icon-btn" onClick={() => quitar(it)} aria-label="Quitar">
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-small btn-outline"
              onClick={() => setAbierto(abierto === c.id ? null : c.id)}
            >
              {abierto === c.id ? 'Cerrar buscador' : c.kind === 'sellers' ? '+ Añadir vendedores' : '+ Añadir cartas'}
            </button>

            {abierto === c.id &&
              (c.kind === 'sellers' ? (
                <SellerPicker existentes={existentes} onAdd={(id) => anadir(c, id)} />
              ) : (
                <CardPicker existentes={existentes} onAdd={(id) => anadir(c, id)} />
              ))}
          </section>
        );
      })}
    </>
  );
}
