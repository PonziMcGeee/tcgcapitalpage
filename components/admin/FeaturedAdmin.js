'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

const HUECOS = [1, 2];

// El administrador elige a mano hasta dos vendedores destacados para la portada.
export default function FeaturedAdmin() {
  const [sellers, setSellers] = useState([]);
  const [huecos, setHuecos] = useState({ 1: { seller_id: '', label: '' }, 2: { seller_id: '', label: '' } });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const sb = getSupabase();
    Promise.all([
      sb.from('sellers_public').select('id, display_name').order('display_name', { ascending: true }),
      sb.from('home_featured_sellers').select('*'),
    ]).then(([vend, dest]) => {
      setSellers(vend.data || []);
      if (dest.error) {
        setMsg({ type: 'error', text: 'No se han podido cargar los destacados. ¿Has ejecutado la migración?' });
      } else {
        const nuevo = { 1: { seller_id: '', label: '' }, 2: { seller_id: '', label: '' } };
        dest.data.forEach((d) => {
          nuevo[d.position] = { seller_id: d.seller_id, label: d.label || '' };
        });
        setHuecos(nuevo);
      }
      setLoading(false);
    });
  }, []);

  function cambiar(pos, campo, valor) {
    setHuecos((h) => ({ ...h, [pos]: { ...h[pos], [campo]: valor } }));
  }

  async function guardar() {
    const sb = getSupabase();
    const elegidos = HUECOS.map((p) => huecos[p].seller_id).filter(Boolean);
    if (new Set(elegidos).size !== elegidos.length) {
      setMsg({ type: 'error', text: 'No puedes poner al mismo vendedor dos veces.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { error: errBorrar } = await sb.from('home_featured_sellers').delete().in('position', HUECOS);
      if (errBorrar) throw errBorrar;
      const filas = HUECOS.filter((p) => huecos[p].seller_id).map((p) => ({
        position: p,
        seller_id: huecos[p].seller_id,
        label: huecos[p].label.trim() || null,
      }));
      if (filas.length) {
        const { error } = await sb.from('home_featured_sellers').insert(filas);
        if (error) throw error;
      }
      setMsg({ type: 'ok', text: 'Destacados guardados. Ya se ven en la portada.' });
    } catch {
      setMsg({ type: 'error', text: 'No se han podido guardar los destacados.' });
    }
    setBusy(false);
  }

  if (loading) return <p className="muted">Cargando…</p>;

  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>
        Elige hasta dos vendedores top. Salen como dos banners grandes debajo del primer carrusel de la portada. El
        texto pequeño de arriba es opcional (por ejemplo "Vendedor del mes").
      </p>

      {msg && <div className={`notice ${msg.type === 'ok' ? 'notice-ok' : 'notice-error'}`}>{msg.text}</div>}

      <div className="admin-list">
        {HUECOS.map((pos) => (
          <div className="collection-box" key={pos}>
            <h3 style={{ marginTop: 0 }}>Banner {pos}</h3>
            <div className="row">
              <div className="field">
                <label htmlFor={`dest-v-${pos}`}>Vendedor</label>
                <select
                  id={`dest-v-${pos}`}
                  value={huecos[pos].seller_id}
                  onChange={(e) => cambiar(pos, 'seller_id', e.target.value)}
                >
                  <option value="">— Vacío —</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`dest-t-${pos}`}>Texto pequeño (opcional)</label>
                <input
                  id={`dest-t-${pos}`}
                  type="text"
                  maxLength={40}
                  placeholder="Vendedor destacado"
                  value={huecos[pos].label}
                  onChange={(e) => cambiar(pos, 'label', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p>
        <button type="button" className="btn" disabled={busy} onClick={guardar}>
          {busy ? 'Guardando…' : 'Guardar destacados'}
        </button>
      </p>
    </>
  );
}
