'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ConfigWarning from '../../components/ConfigWarning';
import { GAMES, euros } from '../../lib/format';
import { prepararFoto } from '../../lib/image';
import { getSupabase } from '../../lib/supabase';
import { useProfile } from '../../lib/useProfile';

const EMPTY_FORM = {
  name: '',
  game: GAMES[0],
  description: '',
  price: '',
  shipping_spain: '',
  shipping_europe: '',
};

export default function PanelVendedor() {
  const { user, profile, loading, reload } = useProfile();

  const [contacto, setContacto] = useState({ display_name: '', phone: '', telegram: '', instagram: '' });
  const [contactoMsg, setContactoMsg] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [formMsg, setFormMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const [mine, setMine] = useState([]);

  useEffect(() => {
    if (profile) {
      setContacto({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        telegram: profile.telegram || '',
        instagram: profile.instagram || '',
      });
    }
  }, [profile]);

  const cargarMias = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) return;
    const { data } = await sb
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    setMine(data || []);
  }, [user]);

  useEffect(() => {
    cargarMias();
  }, [cargarMias]);

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardarContacto(e) {
    e.preventDefault();
    const sb = getSupabase();
    setContactoMsg('');
    const { error } = await sb
      .from('profiles')
      .update({
        display_name: contacto.display_name.trim(),
        phone: contacto.phone.trim() || null,
        telegram: contacto.telegram.trim() || null,
        instagram: contacto.instagram.trim() || null,
      })
      .eq('id', user.id);
    setContactoMsg(error ? 'No se han podido guardar los datos.' : 'Datos guardados.');
    if (!error) reload();
  }

  async function subirFoto(file, lado) {
    const sb = getSupabase();
    const blob = await prepararFoto(file);
    const ruta = `${user.id}/${crypto.randomUUID()}-${lado}.jpg`;
    const { error } = await sb.storage.from('cards').upload(ruta, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return sb.storage.from('cards').getPublicUrl(ruta).data.publicUrl;
  }

  async function publicar(e) {
    e.preventDefault();
    setFormMsg(null);
    if (!front || !back) {
      setFormMsg({ type: 'error', text: 'Sube las dos fotos: delante y detrás.' });
      return;
    }
    const sb = getSupabase();
    setBusy(true);
    try {
      const front_url = await subirFoto(front, 'front');
      const back_url = await subirFoto(back, 'back');
      const { error } = await sb.from('listings').insert({
        seller_id: user.id,
        seller_name: profile.display_name || user.email.split('@')[0],
        name: form.name.trim(),
        game: form.game,
        description: form.description.trim() || null,
        price: Number(form.price),
        shipping_spain: Number(form.shipping_spain || 0),
        shipping_europe: Number(form.shipping_europe || 0),
        front_url,
        back_url,
      });
      if (error) throw error;
      // Se mantiene el envío para la siguiente carta; se limpia lo demás
      setForm((f) => ({ ...EMPTY_FORM, shipping_spain: f.shipping_spain, shipping_europe: f.shipping_europe, game: f.game }));
      setFront(null);
      setBack(null);
      setFormMsg({ type: 'ok', text: '¡Carta publicada! Ya aparece en el catálogo.' });
      cargarMias();
    } catch {
      setFormMsg({ type: 'error', text: 'No se ha podido publicar la carta. Inténtalo de nuevo.' });
    }
    setBusy(false);
  }

  async function cambiarEstado(listing) {
    const sb = getSupabase();
    const status = listing.status === 'sold' ? 'available' : 'sold';
    await sb.from('listings').update({ status }).eq('id', listing.id);
    cargarMias();
  }

  async function borrar(listing) {
    if (!window.confirm(`¿Borrar "${listing.name}" definitivamente?`)) return;
    const sb = getSupabase();
    const rutas = [listing.front_url, listing.back_url]
      .filter(Boolean)
      .map((u) => u.split('/object/public/cards/')[1])
      .filter(Boolean);
    await sb.from('listings').delete().eq('id', listing.id);
    if (rutas.length) await sb.storage.from('cards').remove(rutas);
    cargarMias();
  }

  if (loading) return <p className="muted">Cargando…</p>;

  if (!user) {
    return (
      <div className="empty">
        Tienes que entrar para ver tu panel. <Link href="/login">Entrar</Link>
      </div>
    );
  }

  if (profile?.role !== 'seller') {
    return (
      <div className="empty">
        Tu cuenta es de comprador. Si quieres vender, pídele a Pablo que te active como vendedor.
      </div>
    );
  }

  return (
    <>
      <ConfigWarning />
      <h1>Mi panel de vendedor</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Hola, {profile.display_name}. Aquí subes y gestionas tus cartas.{' '}
        <Link href={`/tienda/${user.id}`}>
          <strong>Ver mi tienda →</strong>
        </Link>
      </p>

      <section className="panel">
        <h2>1. Subir una carta nueva</h2>
        <form className="form" onSubmit={publicar}>
          <div className="photos">
            <FotoCampo titulo="Foto de delante" file={front} onChange={setFront} />
            <FotoCampo titulo="Foto de detrás" file={back} onChange={setBack} />
          </div>

          <div className="field">
            <label htmlFor="name">Nombre de la carta</label>
            <input
              id="name"
              type="text"
              required
              placeholder="Ej: Charizard ex 199/165"
              value={form.name}
              onChange={(e) => cambiar('name', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="game">Juego</label>
            <select id="game" value={form.game} onChange={(e) => cambiar('game', e.target.value)}>
              {GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="price">Precio de la carta (€)</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => cambiar('price', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="ship_es">Envío a España (€)</label>
              <input
                id="ship_es"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.shipping_spain}
                onChange={(e) => cambiar('shipping_spain', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="ship_eu">Envío a Europa (€)</label>
              <input
                id="ship_eu"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.shipping_europe}
                onChange={(e) => cambiar('shipping_europe', e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Notas (opcional)</label>
            <textarea
              id="description"
              rows={2}
              placeholder="Ej: edición, idioma, algún detalle de la carta…"
              value={form.description}
              onChange={(e) => cambiar('description', e.target.value)}
            />
          </div>

          {formMsg && (
            <div className={`notice ${formMsg.type === 'ok' ? 'notice-ok' : 'notice-error'}`}>{formMsg.text}</div>
          )}
          <button className="btn" disabled={busy}>
            {busy ? 'Subiendo fotos…' : 'Publicar carta'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>2. Mis cartas ({mine.length})</h2>
        {mine.length === 0 && <p className="muted">Todavía no has subido ninguna carta.</p>}
        <div className="my-list">
          {mine.map((l) => (
            <div className="my-item" key={l.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.front_url} alt={l.name} />
              <div>
                <strong>{l.name}</strong>
                <p className="muted small">
                  {l.game} · {euros(l.price)}
                </p>
                <span className={`badge ${l.status === 'sold' ? 'badge-sold' : ''}`}>
                  {l.status === 'sold' ? 'Vendida' : 'En venta'}
                </span>
              </div>
              <div className="my-actions">
                <button type="button" className="btn btn-small btn-outline" onClick={() => cambiarEstado(l)}>
                  {l.status === 'sold' ? 'Volver a poner en venta' : 'Marcar como vendida'}
                </button>
                <button type="button" className="btn btn-small btn-danger" onClick={() => borrar(l)}>
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>3. Mis datos de contacto</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Los compradores con cuenta verán botones para escribirte por WhatsApp, Telegram o Instagram. Rellena los que
          quieras.
        </p>
        <form className="form" onSubmit={guardarContacto}>
          <div className="field">
            <label htmlFor="dn">Tu nombre en la web</label>
            <input
              id="dn"
              type="text"
              required
              value={contacto.display_name}
              onChange={(e) => setContacto({ ...contacto, display_name: e.target.value })}
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="phone">WhatsApp</label>
              <input
                id="phone"
                type="text"
                placeholder="+34 600 000 000"
                value={contacto.phone}
                onChange={(e) => setContacto({ ...contacto, phone: e.target.value })}
              />
              <span className="hint">Número de tu WhatsApp. Se mostrará un botón, no el número.</span>
            </div>
            <div className="field">
              <label htmlFor="tg">Telegram</label>
              <input
                id="tg"
                type="text"
                placeholder="@usuario"
                value={contacto.telegram}
                onChange={(e) => setContacto({ ...contacto, telegram: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="ig">Instagram</label>
              <input
                id="ig"
                type="text"
                placeholder="@usuario"
                value={contacto.instagram}
                onChange={(e) => setContacto({ ...contacto, instagram: e.target.value })}
              />
            </div>
          </div>
          {contactoMsg && (
            <div className={`notice ${contactoMsg.startsWith('Datos') ? 'notice-ok' : 'notice-error'}`}>
              {contactoMsg}
            </div>
          )}
          <button className="btn">Guardar datos</button>
        </form>
      </section>
    </>
  );
}

function FotoCampo({ titulo, file, onChange }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="photo-drop">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={titulo} />
      ) : (
        <div className="photo-empty">{titulo}</div>
      )}
      <label className="btn btn-small btn-outline" style={{ cursor: 'pointer' }}>
        {file ? 'Cambiar foto' : 'Elegir foto'}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}
