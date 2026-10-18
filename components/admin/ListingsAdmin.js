'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { euros, gameLabel } from '../../lib/format';
import { getSupabase } from '../../lib/supabase';

const POR_PAGINA = 24;

function rutaEnCards(url) {
  return url ? decodeURIComponent((url.split('/object/public/cards/')[1] || '').split('?')[0]) : '';
}

// Moderación: el administrador ve las cartas de todos los vendedores y puede borrar las que no sean adecuadas.
export default function ListingsAdmin({ vendedorInicial }) {
  const [sellers, setSellers] = useState([]);
  const [vendedor, setVendedor] = useState(vendedorInicial || '');
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [cartas, setCartas] = useState([]);
  const [hayMas, setHayMas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    getSupabase()
      .from('sellers_public')
      .select('id, display_name')
      .then(({ data }) => setSellers((data || []).sort((a, b) => a.display_name.localeCompare(b.display_name))));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setBusqueda(texto.trim()), 300);
    return () => clearTimeout(t);
  }, [texto]);

  const cargar = useCallback(
    async (desde) => {
      const sb = getSupabase();
      setLoading(true);
      let q = sb
        .from('listings')
        .select('id, seller_id, seller_name, name, game, collection, price, status, front_url, back_url, created_at')
        .order('created_at', { ascending: false })
        .range(desde, desde + POR_PAGINA);
      if (vendedor) q = q.eq('seller_id', vendedor);
      if (estado) q = q.eq('status', estado);
      if (busqueda) q = q.ilike('name', `%${busqueda.replace(/[%,]/g, ' ')}%`);
      const { data, error } = await q;
      if (error) {
        setMsg({ type: 'error', text: 'No se han podido cargar las cartas.' });
        setLoading(false);
        return;
      }
      setHayMas(data.length > POR_PAGINA);
      const pagina = data.slice(0, POR_PAGINA);
      setCartas((prev) => (desde === 0 ? pagina : [...prev, ...pagina]));
      setLoading(false);
    },
    [vendedor, estado, busqueda]
  );

  useEffect(() => {
    cargar(0);
  }, [cargar]);

  async function borrar(c) {
    if (!window.confirm(`¿Borrar "${c.name}" de ${c.seller_name}? Se borran también sus fotos y no se puede deshacer.`)) return;
    const sb = getSupabase();
    setMsg(null);
    const { error } = await sb.from('listings').delete().eq('id', c.id);
    if (error) {
      setMsg({ type: 'error', text: 'No se ha podido borrar. ¿Has ejecutado la migración de moderación?' });
      return;
    }
    const rutas = [rutaEnCards(c.front_url), rutaEnCards(c.back_url)].filter(Boolean);
    if (rutas.length) await sb.storage.from('cards').remove(rutas);
    setCartas((prev) => prev.filter((x) => x.id !== c.id));
    setMsg({ type: 'ok', text: `Carta "${c.name}" borrada.` });
  }

  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>
        Aquí ves las cartas de todos los vendedores. Si alguna no es adecuada (una foto ofensiva, por ejemplo), bórrala.
      </p>

      <div className="filters">
        <input type="text" placeholder="Buscar por nombre de carta…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <select value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
          <option value="">Todos los vendedores</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Disponibles y vendidas</option>
          <option value="available">Solo disponibles</option>
          <option value="sold">Solo vendidas</option>
        </select>
      </div>

      {msg && <div className={`notice ${msg.type === 'ok' ? 'notice-ok' : 'notice-error'}`}>{msg.text}</div>}

      <div className="admin-list">
        {cartas.map((c) => (
          <div className="admin-row" key={c.id}>
            <a href={c.front_url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="admin-thumb admin-thumb-card" src={c.front_url} alt={c.name} />
            </a>
            {c.back_url && (
              <a href={c.back_url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="admin-thumb admin-thumb-card" src={c.back_url} alt={`${c.name} (detrás)`} />
              </a>
            )}
            <div className="admin-row-main">
              <strong>{c.name}</strong>
              <p className="muted small">
                {gameLabel(c)} · {euros(c.price)} · {c.status === 'sold' ? 'Vendida' : 'Disponible'}
              </p>
              <p className="muted small">
                Vende <Link href={`/tienda/${c.seller_id}`}>{c.seller_name}</Link>
              </p>
            </div>
            <div className="admin-actions">
              <Link href={`/carta/${c.id}`} className="btn btn-small btn-outline">
                Ver
              </Link>
              <button type="button" className="btn btn-small btn-danger" onClick={() => borrar(c)}>
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {!loading && cartas.length === 0 && <div className="empty">No hay cartas que coincidan.</div>}
      {!loading && hayMas && (
        <p style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-outline" onClick={() => cargar(cartas.length)}>
            Mostrar más
          </button>
        </p>
      )}
    </>
  );
}
