'use client';

import { useEffect, useMemo, useState } from 'react';
import CardTile from '../../components/CardTile';
import SearchSelect from '../../components/SearchSelect';
import ConfigWarning from '../../components/ConfigWarning';
import SellerSection from '../../components/SellerSection';
import { deriveSellers, fetchAllAvailable, fetchSellers } from '../../lib/data';
import { ERAS, ESPECIALES, ESPECIAL_LABEL, IDIOMAS, OTRA, inferirIdiomaEra, setsDe } from '../../lib/collections';
import { GAMES } from '../../lib/format';
import { ORDENES, ordenar, porOrdenVendedor } from '../../lib/orden';
import { getSupabase } from '../../lib/supabase';
import { useFavorites } from '../../lib/useFavorites';

const PREVIEW = 6; // cartas que se enseñan por vendedor en la vista agrupada
const STEP = 24; // cartas que se añaden cada vez en la vista "todas juntas"

export default function Catalogo() {
  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [game, setGame] = useState('');
  const [coleccion, setColeccion] = useState('');
  const [seller, setSeller] = useState('');
  const [vista, setVista] = useState('todas');
  const [mostradas, setMostradas] = useState(STEP);
  const [soloFav, setSoloFav] = useState(false);
  const [idioma, setIdioma] = useState('');
  const [era, setEra] = useState('');
  const [orden, setOrden] = useState('alfabetico');
  const favs = useFavorites();

  // Enlaces desde el buscador: /catalogo?coleccion=… o ?q=…
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('coleccion')) setColeccion(p.get('coleccion'));
    if (p.get('q')) setSearch(p.get('q'));
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    Promise.all([fetchAllAvailable(sb), fetchSellers(sb)]).then(([cartas, vendedores]) => {
      if (cartas.error) {
        setError('No se han podido cargar las cartas.');
      } else {
        setListings(cartas.data);
        setSellers(vendedores.error ? deriveSellers(cartas.data) : vendedores.data);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setMostradas(STEP);
  }, [search, game, coleccion, seller, vista, soloFav, idioma, era, orden]);

  const sellerMap = useMemo(() => new Map(sellers.map((s) => [s.id, s])), [sellers]);

  const visibles = useMemo(
    () =>
      ordenar(listings.filter((l) => {
        if (game && l.game !== game) return false;
        if (coleccion && l.collection !== coleccion) return false;
        if (idioma || era) {
          const deducido = inferirIdiomaEra(l.collection);
          if (idioma && (l.language || deducido.idioma) !== idioma) return false;
          if (era && (l.era || deducido.era) !== era) return false;
        }
        if (seller && l.seller_id !== seller) return false;
        if (soloFav && !favs.cards.has(l.id)) return false;
        if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }), orden),
    [listings, game, coleccion, seller, search, soloFav, favs.cards, idioma, era, orden]
  );

  // Vista por vendedor: un bloque por vendedor con solo unas pocas cartas de muestra
  const grupos = useMemo(() => {
    if (vista !== 'vendedores') return [];
    const porVendedor = new Map();
    visibles.forEach((l) => {
      if (!porVendedor.has(l.seller_id)) porVendedor.set(l.seller_id, []);
      porVendedor.get(l.seller_id).push(l);
    });
    return sellers
      .filter((s) => porVendedor.has(s.id))
      .map((s) => ({
        seller: s,
        // Con el orden por defecto, cada vendedor enseña primero las cartas que él ha elegido
        items: orden === 'alfabetico' ? [...porVendedor.get(s.id)].sort(porOrdenVendedor) : porVendedor.get(s.id),
      }));
  }, [vista, visibles, sellers, orden]);

  const vendedoresConCartas = sellers.filter((s) => s.cards_available > 0);

  return (
    <>
      <ConfigWarning />
      <h1>Cartas TCG en venta</h1>
      <p className="muted">Regístrate para ver cómo contactar con los vendedores.</p>

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar carta…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={game}
          onChange={(e) => {
            setGame(e.target.value);
            setColeccion('');
          }}
        >
          <option value="">Todos los juegos</option>
          {GAMES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={seller} onChange={(e) => setSeller(e.target.value)}>
          <option value="">Todos los vendedores</option>
          {vendedoresConCartas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <select
            value={idioma}
            onChange={(e) => {
              setIdioma(e.target.value);
              setColeccion('');
              if (e.target.value) setGame('Pokémon');
            }}
          >
            <option value="">Todos los idiomas</option>
            {IDIOMAS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
          <select
            value={era}
            onChange={(e) => {
              setEra(e.target.value);
              setColeccion('');
              if (e.target.value) setGame('Pokémon');
            }}
          >
            <option value="">Todas las eras</option>
            {ERAS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.corto}
              </option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <SearchSelect
            value={coleccion}
            onChange={(v) => {
              setColeccion(v);
              if (v && !ESPECIALES.includes(v) && v !== OTRA) setGame('Pokémon');
            }}
            emptyLabel="Todas las colecciones"
            placeholder="Escribe para buscar la colección…"
            options={[...ESPECIALES, ...setsDe(idioma, era), OTRA].map((x) => ({ value: x, label: ESPECIAL_LABEL[x] || x }))}
          />
        </div>
      </div>

      <div className="toolbar">
        <div className="toggle" role="group" aria-label="Forma de ver las cartas">
          <button type="button" className={vista === 'todas' ? 'active' : ''} onClick={() => setVista('todas')}>
            Todas juntas
          </button>
          <button
            type="button"
            className={vista === 'vendedores' ? 'active' : ''}
            onClick={() => setVista('vendedores')}
          >
            Por vendedor
          </button>
        </div>
        <button
          type="button"
          className={`fav-filter ${soloFav ? 'active' : ''}`}
          aria-pressed={soloFav}
          onClick={() => (favs.logged || !favs.loaded ? setSoloFav((v) => !v) : (window.location.href = '/login'))}
        >
          ♥ Solo favoritos
        </button>
        <select className="sort-select" value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar cartas">
          {ORDENES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!loading && <span className="muted small">{visibles.length} cartas</span>}
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && !error && visibles.length === 0 && (
        <div className="empty">
          {soloFav ? 'Todavía no has marcado ninguna carta como favorita (con estos filtros).' : 'No hay cartas que mostrar.'}
        </div>
      )}

      {vista === 'vendedores' &&
        grupos.map((g) => (
          <SellerSection
            key={g.seller.id}
            sellerId={g.seller.id}
            name={g.seller.display_name}
            color={g.seller.color}
            avatarUrl={g.seller.avatar_url}
            // Si se filtra por un vendedor concreto se enseñan todas sus cartas
            listings={seller ? g.items : g.items.slice(0, PREVIEW)}
            total={g.items.length}
          />
        ))}

      {vista === 'todas' && (
        <>
          <div className="grid">
            {visibles.slice(0, mostradas).map((l) => (
              <CardTile key={l.id} listing={l} color={sellerMap.get(l.seller_id)?.color} />
            ))}
          </div>
          {mostradas < visibles.length && (
            <p className="more-row">
              <button type="button" className="btn btn-outline" onClick={() => setMostradas((m) => m + STEP)}>
                Mostrar más ({visibles.length - mostradas} restantes)
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
