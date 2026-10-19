'use client';

import { useCallback, useEffect, useState } from 'react';
import { prepararFoto } from '../../lib/image';
import { getSupabase } from '../../lib/supabase';

function BannerForm({ inicial, onSave, onCancel, busy }) {
  // Los campos vacíos llegan como null desde la base de datos: se pasan a texto vacío
  const [campos, setCampos] = useState(() => ({
    title: inicial?.title ?? '',
    subtitle: inicial?.subtitle ?? '',
    button_text: inicial?.button_text ?? '',
    link_url: inicial?.link_url ?? '',
  }));
  const [file, setFile] = useState(null);

  function enviar(e) {
    e.preventDefault();
    onSave(campos, file);
  }

  function cambiar(campo, valor) {
    setCampos((c) => ({ ...c, [campo]: valor }));
  }

  return (
    <form className="form" onSubmit={enviar}>
      <div className="field">
        <label>Imagen del banner {inicial ? '(déjala vacía para mantener la actual)' : ''}</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <span className="hint">Se ve entera, sin recortes. Mejor con proporción 1280×771 (como el banner actual).</span>
      </div>
      <div className="row">
        <div className="field">
          <label>Título (opcional)</label>
          <input type="text" value={campos.title} onChange={(e) => cambiar('title', e.target.value)} />
        </div>
        <div className="field">
          <label>Subtítulo (opcional)</label>
          <input type="text" value={campos.subtitle} onChange={(e) => cambiar('subtitle', e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label>Texto del botón</label>
          <input
            type="text"
            placeholder="Ver ahora"
            value={campos.button_text}
            onChange={(e) => cambiar('button_text', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Enlace del botón</label>
          <input
            type="text"
            placeholder="/catalogo, /tienda/… o https://…"
            value={campos.link_url}
            onChange={(e) => cambiar('link_url', e.target.value)}
          />
        </div>
      </div>
      <div className="admin-actions">
        <button className="btn" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar banner'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

// Editor del slider de banners de la portada.
export default function BannersAdmin() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editando, setEditando] = useState(null); // id del banner que se edita, o 'nuevo'

  const cargar = useCallback(async () => {
    const sb = getSupabase();
    const { data, error } = await sb.from('home_banners').select('*').order('position', { ascending: true });
    if (error) setMsg({ type: 'error', text: 'No se han podido cargar los banners. ¿Has ejecutado la migración?' });
    else setBanners(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(banner, campos, file) {
    const sb = getSupabase();
    setBusy(true);
    setMsg(null);
    try {
      let image_url = banner?.image_url;
      if (file) {
        const blob = await prepararFoto(file, 1800);
        const ruta = `banners/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from('site').upload(ruta, blob, { contentType: 'image/jpeg' });
        if (error) throw error;
        image_url = sb.storage.from('site').getPublicUrl(ruta).data.publicUrl;
      }
      if (!image_url) {
        setMsg({ type: 'error', text: 'Elige una imagen para el banner.' });
        setBusy(false);
        return;
      }
      const datos = {
        image_url,
        title: (campos.title || '').trim() || null,
        subtitle: (campos.subtitle || '').trim() || null,
        button_text: (campos.button_text || '').trim() || null,
        link_url: (campos.link_url || '').trim() || null,
      };
      const resultado = banner
        ? await sb.from('home_banners').update(datos).eq('id', banner.id)
        : await sb
            .from('home_banners')
            .insert({ ...datos, position: banners.reduce((m, b) => Math.max(m, b.position), 0) + 1 });
      if (resultado.error) throw resultado.error;
      setEditando(null);
      setMsg({ type: 'ok', text: 'Banner guardado.' });
      cargar();
    } catch (err) {
      setMsg({ type: 'error', text: `No se ha podido guardar el banner${err?.message ? `: ${err.message}` : '.'}` });
    }
    setBusy(false);
  }

  async function alternarActivo(b) {
    const sb = getSupabase();
    await sb.from('home_banners').update({ active: !b.active }).eq('id', b.id);
    cargar();
  }

  async function mover(indice, direccion) {
    const sb = getSupabase();
    const a = banners[indice];
    const b = banners[indice + direccion];
    if (!a || !b) return;
    await Promise.all([
      sb.from('home_banners').update({ position: b.position }).eq('id', a.id),
      sb.from('home_banners').update({ position: a.position }).eq('id', b.id),
    ]);
    cargar();
  }

  async function borrar(b) {
    if (!window.confirm('¿Borrar este banner?')) return;
    const sb = getSupabase();
    await sb.from('home_banners').delete().eq('id', b.id);
    const ruta = b.image_url.split('/object/public/site/')[1];
    if (ruta) await sb.storage.from('site').remove([ruta]);
    cargar();
  }

  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>
        Son los banners grandes de arriba de la portada. Pasan solos; el orden de esta lista es el orden en la web.
      </p>

      {msg && <div className={`notice ${msg.type === 'ok' ? 'notice-ok' : 'notice-error'}`}>{msg.text}</div>}

      {editando === 'nuevo' ? (
        <div className="panel">
          <h2>Nuevo banner</h2>
          <BannerForm onSave={(c, f) => guardar(null, c, f)} onCancel={() => setEditando(null)} busy={busy} />
        </div>
      ) : (
        <p style={{ marginBottom: 16 }}>
          <button type="button" className="btn" onClick={() => setEditando('nuevo')}>
            + Añadir banner
          </button>
        </p>
      )}

      {loading && <p className="muted">Cargando…</p>}
      {!loading && banners.length === 0 && (
        <div className="empty">Todavía no hay banners. Mientras tanto, la portada enseña su presentación por defecto.</div>
      )}

      <div className="admin-list">
        {banners.map((b, i) => (
          <div key={b.id}>
            <div className="admin-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="admin-thumb" src={b.image_url} alt="" />
              <div className="admin-row-main">
                <strong>{b.title || 'Sin título'}</strong>
                <p className="muted small">{b.link_url || 'Sin enlace'}</p>
              </div>
              <div className="admin-actions">
                <label>
                  <input type="checkbox" checked={b.active} onChange={() => alternarActivo(b)} />
                  Visible
                </label>
                <button type="button" className="icon-btn" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === banners.length - 1}
                  onClick={() => mover(i, 1)}
                  aria-label="Bajar"
                >
                  ↓
                </button>
                <button type="button" className="btn btn-small btn-outline" onClick={() => setEditando(b.id)}>
                  Editar
                </button>
                <button type="button" className="btn btn-small btn-danger" onClick={() => borrar(b)}>
                  Borrar
                </button>
              </div>
            </div>
            {editando === b.id && (
              <div className="panel" style={{ marginTop: 8 }}>
                <BannerForm
                  inicial={b}
                  onSave={(c, f) => guardar(b, c, f)}
                  onCancel={() => setEditando(null)}
                  busy={busy}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
