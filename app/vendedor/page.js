'use client';

import Link from 'next/link';
import SellerBadge from '../../components/SellerBadge';
import { useCallback, useEffect, useState } from 'react';
import { porOrdenVendedor } from '../../lib/orden';
import SearchSelect from '../../components/SearchSelect';
import ConfigWarning from '../../components/ConfigWarning';
import { ERAS, ESPECIALES, ESPECIAL_LABEL, IDIOMAS, OTRA, coleccionesPara, inferirIdiomaEra } from '../../lib/collections';
import { CONDITIONS, GAMES, SELLER_COLORS, conditionLabel, euros, gameLabel, sellerColor } from '../../lib/format';
import { prepararAvatar, prepararFoto, prepararMiniatura } from '../../lib/image';
import { isSeller } from '../../lib/roles';
import { getSupabase } from '../../lib/supabase';
import { useProfile } from '../../lib/useProfile';

const EMPTY_FORM = {
  name: '',
  game: GAMES[0],
  language: '',
  era: '',
  collection: '',
  condition: 'NM',
  accepts_trade: false,
  description: '',
  price: '',
  shipping_spain: '',
  shipping_europe: '',
};

// Número para que una carta nueva salga la primera (uno menos que el menor que haya)
function primerNumero(lista) {
  const nums = lista.map((l) => l.sort_order).filter((n) => typeof n === 'number');
  return nums.length ? Math.min(...nums) - 1 : null;
}

export default function PanelVendedor() {
  const { user, profile, loading, reload } = useProfile();

  const [contacto, setContacto] = useState({ display_name: '', phone: '', telegram: '', instagram: '', color: '' });
  const [contactoMsg, setContactoMsg] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [formMsg, setFormMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const [mine, setMine] = useState([]);
  const [moviendo, setMoviendo] = useState(false);
  const [ordenMsg, setOrdenMsg] = useState('');
  const [editando, setEditando] = useState(null); // carta que se está editando, o null
  const [ventas, setVentas] = useState({}); // listing_id -> nombre del comprador
  const [vendiendo, setVendiendo] = useState(null); // carta que se está marcando como vendida
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [ventaMsg, setVentaMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setContacto({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        telegram: profile.telegram || '',
        instagram: profile.instagram || '',
        color: profile.color || '',
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
    setMine([...(data || [])].sort(porOrdenVendedor));
    const { data: ventasData } = await sb.from('sales').select('listing_id, buyer_name').eq('seller_id', user.id);
    setVentas(Object.fromEntries((ventasData || []).map((s) => [s.listing_id, s.buyer_name])));
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
        color: contacto.color || null,
      })
      .eq('id', user.id);
    setContactoMsg(error ? 'No se han podido guardar los datos.' : 'Datos guardados.');
    if (!error) reload();
  }

  async function subirFoto(file, lado) {
    const sb = getSupabase();
    const blob = lado === 'thumb' ? await prepararMiniatura(file) : await prepararFoto(file);
    const ruta = `${user.id}/${crypto.randomUUID()}-${lado}.jpg`;
    // Los nombres no se repiten nunca, así que el navegador puede guardar la foto un año
    const { error } = await sb.storage
      .from('cards')
      .upload(ruta, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw error;
    return sb.storage.from('cards').getPublicUrl(ruta).data.publicUrl;
  }

  function rutaCards(url) {
    return url ? url.split('/object/public/cards/')[1] : null;
  }

  function empezarEdicion(l) {
    setEditando(l);
    setForm({
      name: l.name,
      game: l.game,
      language: l.language || inferirIdiomaEra(l.collection).idioma,
      era: l.era || inferirIdiomaEra(l.collection).era,
      collection: l.collection || '',
      condition: l.condition || 'NM',
      accepts_trade: !!l.accepts_trade,
      description: l.description || '',
      price: String(l.price),
      shipping_spain: String(l.shipping_spain ?? ''),
      shipping_europe: String(l.shipping_europe ?? ''),
    });
    setFront(null);
    setBack(null);
    setFormMsg(null);
    document.getElementById('formulario-carta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelarEdicion() {
    setEditando(null);
    setForm((f) => ({ ...EMPTY_FORM, shipping_spain: f.shipping_spain, shipping_europe: f.shipping_europe, game: f.game }));
    setFront(null);
    setBack(null);
    setFormMsg(null);
  }

  async function publicar(e) {
    e.preventDefault();
    setFormMsg(null);
    if (!editando && (!front || !back)) {
      setFormMsg({ type: 'error', text: 'Sube las dos fotos: delante y detrás.' });
      return;
    }
    const sb = getSupabase();
    setBusy(true);
    try {
      const datos = {
        name: form.name.trim(),
        game: form.game,
        language: form.game === 'Pokémon' && form.language ? form.language : null,
        era: form.game === 'Pokémon' && form.era ? form.era : null,
        collection:
          form.collection && coleccionesPara(form.game, form.language, form.era).includes(form.collection)
            ? form.collection
            : null,
        condition: form.condition,
        accepts_trade: !!form.accepts_trade,
        description: form.description.trim() || null,
        price: Number(form.price),
        shipping_spain: Number(form.shipping_spain || 0),
        shipping_europe: Number(form.shipping_europe || 0),
      };
      if (editando) {
        // Solo se cambian las fotos que se hayan vuelto a elegir
        const viejas = [];
        if (front) {
          datos.front_url = await subirFoto(front, 'front');
          datos.thumb_url = await subirFoto(front, 'thumb');
          viejas.push(rutaCards(editando.front_url), rutaCards(editando.thumb_url));
        }
        if (back) {
          datos.back_url = await subirFoto(back, 'back');
          viejas.push(rutaCards(editando.back_url));
        }
        const { error } = await sb.from('listings').update(datos).eq('id', editando.id);
        if (error) throw error;
        const aBorrar = viejas.filter(Boolean);
        if (aBorrar.length) await sb.storage.from('cards').remove(aBorrar);
        cancelarEdicion();
        setFormMsg({ type: 'ok', text: 'Cambios guardados.' });
      } else {
        const front_url = await subirFoto(front, 'front');
        const back_url = await subirFoto(back, 'back');
        const thumb_url = await subirFoto(front, 'thumb');
        const { error } = await sb.from('listings').insert({
          seller_id: user.id,
          sort_order: primerNumero(mine),
          seller_name: profile.display_name || user.email.split('@')[0],
          ...datos,
          front_url,
          thumb_url,
          back_url,
        });
        if (error) throw error;
        // Se mantiene el envío para la siguiente carta; se limpia lo demás
        setForm((f) => ({ ...EMPTY_FORM, shipping_spain: f.shipping_spain, shipping_europe: f.shipping_europe, game: f.game }));
        setFront(null);
        setBack(null);
        setFormMsg({ type: 'ok', text: '¡Carta publicada! Ya aparece en el catálogo.' });
      }
      cargarMias();
    } catch {
      setFormMsg({ type: 'error', text: 'No se ha podido guardar la carta. Inténtalo de nuevo.' });
    }
    setBusy(false);
  }

  // Crea la miniatura de las cartas subidas antes de existir esta función
  const sinMiniatura = mine.filter((l) => !l.thumb_url);
  const [optimizando, setOptimizando] = useState(false);

  async function optimizarAntiguas() {
    const sb = getSupabase();
    setOptimizando(true);
    setFormMsg(null);
    try {
      for (const l of sinMiniatura) {
        const resp = await fetch(l.front_url);
        const blob = await resp.blob();
        const thumb_url = await subirFoto(blob, 'thumb');
        const { error } = await sb.from('listings').update({ thumb_url }).eq('id', l.id);
        if (error) throw error;
      }
      setFormMsg({ type: 'ok', text: 'Listo: las fotos antiguas ya están optimizadas.' });
    } catch {
      setFormMsg({ type: 'error', text: 'No se han podido optimizar todas las fotos. Inténtalo de nuevo.' });
    }
    setOptimizando(false);
    cargarMias();
  }

  const [subiendoAvatar, setSubiendoAvatar] = useState(false);

  async function cambiarAvatar(file) {
    if (!file) return;
    const sb = getSupabase();
    setSubiendoAvatar(true);
    setContactoMsg('');
    try {
      const blob = await prepararAvatar(file);
      const ruta = `${user.id}/avatar-${crypto.randomUUID()}.jpg`;
      const { error: errSubida } = await sb.storage
        .from('cards')
        .upload(ruta, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (errSubida) throw errSubida;
      const avatar_url = sb.storage.from('cards').getPublicUrl(ruta).data.publicUrl;
      const { error } = await sb.from('profiles').update({ avatar_url }).eq('id', user.id);
      if (error) throw error;
      const vieja = rutaCards(profile.avatar_url);
      if (vieja) await sb.storage.from('cards').remove([vieja]);
      setContactoMsg('Foto de perfil guardada.');
      reload();
    } catch {
      setContactoMsg('No se ha podido guardar la foto de perfil. ¿Has ejecutado la migración de Supabase?');
    }
    setSubiendoAvatar(false);
  }

  async function quitarAvatar() {
    const sb = getSupabase();
    const vieja = rutaCards(profile.avatar_url);
    await sb.from('profiles').update({ avatar_url: null }).eq('id', user.id);
    if (vieja) await sb.storage.from('cards').remove([vieja]);
    reload();
  }

  // Mover una carta en el orden de la tienda: 'arriba' del todo, o un puesto 'sube' / 'baja'
  async function mover(l, accion) {
    const sb = getSupabase();
    if (!sb || moviendo) return;
    const lista = [...mine];
    const i = lista.findIndex((x) => x.id === l.id);
    const j = accion === 'arriba' ? 0 : accion === 'sube' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= lista.length || i === j) return;
    lista.splice(j, 0, lista.splice(i, 1)[0]);
    const nueva = lista.map((x, n) => ({ ...x, sort_order: n }));
    const cambiadas = nueva.filter((x, n) => mine.find((y) => y.id === x.id)?.sort_order !== n);
    setMine(nueva); // se ve al instante
    setMoviendo(true);
    setOrdenMsg('');
    const resultados = await Promise.all(
      cambiadas.map((x) => sb.from('listings').update({ sort_order: x.sort_order }).eq('id', x.id))
    );
    setMoviendo(false);
    if (resultados.some((r) => r.error)) {
      setOrdenMsg('No se ha podido guardar el orden. ¿Has ejecutado la migración de Supabase "orden-vendedor"? (mira el README)');
      cargarMias();
    }
  }

  async function cambiarEstado(listing) {
    const sb = getSupabase();
    if (listing.status !== 'sold') {
      // Al marcar como vendida se pregunta a quién (opcional) para que pueda dejar una reseña
      setVendiendo(listing);
      setBusqueda('');
      setResultados([]);
      setVentaMsg('');
      return;
    }
    await sb.from('listings').update({ status: 'available' }).eq('id', listing.id);
    await sb.from('sales').delete().eq('listing_id', listing.id);
    cargarMias();
  }

  async function buscarComprador(texto) {
    setBusqueda(texto);
    setVentaMsg('');
    if (texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    const sb = getSupabase();
    setBuscando(true);
    const { data, error } = await sb.rpc('buscar_compradores', { q: texto });
    setBuscando(false);
    if (error) {
      setVentaMsg('No se ha podido buscar. ¿Has ejecutado la migración de reseñas?');
      return;
    }
    setResultados(data || []);
  }

  async function confirmarVenta(comprador) {
    const sb = getSupabase();
    const { error } = await sb.from('listings').update({ status: 'sold' }).eq('id', vendiendo.id);
    if (error) {
      setVentaMsg('No se ha podido marcar como vendida.');
      return;
    }
    if (comprador) {
      const { error: errVenta } = await sb
        .from('sales')
        .upsert({ listing_id: vendiendo.id, seller_id: user.id, buyer_id: comprador.id }, { onConflict: 'listing_id' });
      if (errVenta) {
        setVentaMsg('La carta se ha marcado como vendida, pero no se ha podido guardar el comprador.');
        cargarMias();
        return;
      }
    }
    setVendiendo(null);
    cargarMias();
  }

  async function borrar(listing) {
    if (!window.confirm(`¿Borrar "${listing.name}" definitivamente?`)) return;
    const sb = getSupabase();
    const rutas = [listing.front_url, listing.back_url, listing.thumb_url]
      .filter(Boolean)
      .map((u) => u.split('/object/public/cards/')[1])
      .filter(Boolean);
    await sb.from('listings').delete().eq('id', listing.id);
    if (editando?.id === listing.id) cancelarEdicion();
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

  if (!isSeller(profile)) {
    return (
      <div className="empty">
        Tu cuenta es de comprador. Si quieres vender, pídele a un administrador que te active como vendedor.
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

      <section className="panel" id="formulario-carta">
        <h2>{editando ? `1. Editar: ${editando.name}` : '1. Subir una carta nueva'}</h2>
        <form className="form" onSubmit={publicar}>
          <div className="photos">
            <FotoCampo titulo="Foto de delante" file={front} onChange={setFront} actual={editando?.front_url} />
            <FotoCampo titulo="Foto de detrás" file={back} onChange={setBack} actual={editando?.back_url} />
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

          {form.game === 'Pokémon' && (
            <div className="row">
              <div className="field">
                <label htmlFor="language">Idioma de la carta</label>
                <select
                  id="language"
                  value={form.language}
                  onChange={(e) => setForm((f) => ({ ...f, language: e.target.value, collection: ESPECIALES.includes(f.collection) || f.collection === OTRA ? f.collection : '' }))}
                >
                  <option value="">Elige el idioma…</option>
                  {IDIOMAS.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="era">Era</label>
                <select
                  id="era"
                  value={form.era}
                  disabled={!form.language}
                  onChange={(e) => setForm((f) => ({ ...f, era: e.target.value, collection: ESPECIALES.includes(f.collection) || f.collection === OTRA ? f.collection : '' }))}
                >
                  <option value="">{form.language ? 'Elige la era…' : 'Primero elige el idioma'}</option>
                  {ERAS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="collection">Set / colección</label>
            <SearchSelect
              id="collection"
              value={form.collection}
              onChange={(c) => cambiar('collection', c)}
              options={coleccionesPara(form.game, form.language, form.era).map((c) => ({
                value: c,
                label: ESPECIAL_LABEL[c] || c,
              }))}
              emptyLabel={
                form.game === 'Pokémon' && !(form.language && form.era)
                  ? 'Elige idioma y era para ver los sets'
                  : 'Sin indicar'
              }
              placeholder="Escribe para buscar el set…"
            />
          </div>

          <div className="field">
            <label htmlFor="condition">Estado de la carta</label>
            <select id="condition" value={form.condition} onChange={(e) => cambiar('condition', e.target.value)}>
              {CONDITIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={!!form.accepts_trade}
              onChange={(e) => cambiar('accepts_trade', e.target.checked)}
            />
            <span>Admito trade (intercambio) por esta carta</span>
          </label>

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
          <div className="admin-actions">
            <button className="btn" disabled={busy}>
              {busy ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar carta'}
            </button>
            {editando && (
              <button type="button" className="btn btn-outline" onClick={cancelarEdicion}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>2. Mis cartas ({mine.length})</h2>
        {mine.length === 0 && <p className="muted">Todavía no has subido ninguna carta.</p>}
        {mine.length > 1 && (
          <p className="muted small">
            Con las flechas eliges el orden en que salen tus cartas en tu tienda (el comprador puede cambiarlo con sus
            filtros).
          </p>
        )}
        {ordenMsg && <div className="notice notice-error">{ordenMsg}</div>}
        {sinMiniatura.length > 0 && (
          <div className="notice" style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px' }}>
              {sinMiniatura.length} {sinMiniatura.length === 1 ? 'carta tiene' : 'cartas tienen'} fotos antiguas que
              cargan lento. Pulsa para optimizarlas (se hace una sola vez).
            </p>
            <button type="button" className="btn btn-small" disabled={optimizando} onClick={optimizarAntiguas}>
              {optimizando ? 'Optimizando…' : 'Optimizar fotos antiguas'}
            </button>
          </div>
        )}
        <div className="my-list">
          {mine.map((l, idx) => (
            <div className="my-item" key={l.id}>
              <Link href={`/carta/${l.id}`} className="my-item-link" aria-label={`Ver ${l.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.thumb_url || l.front_url} alt={l.name} />
              </Link>
              <div>
                <Link href={`/carta/${l.id}`} className="my-item-name">
                  <strong>{l.name}</strong>
                </Link>
                <p className="muted small">
                  {gameLabel(l)} · {conditionLabel(l.condition)} · {euros(l.price)}{l.accepts_trade ? ' · Trade' : ''}
                </p>
                <span className={`badge ${l.status === 'sold' ? 'badge-sold' : ''}`}>
                  {l.status === 'sold' ? 'Vendida' : 'En venta'}
                </span>
                {l.status === 'sold' && ventas[l.id] && <span className="muted small"> a {ventas[l.id]}</span>}
              </div>
              <div className="my-actions">
                {mine.length > 1 && (
                  <span className="order-btns" role="group" aria-label="Orden en tu tienda">
                    <button type="button" title="Poner la primera" aria-label="Poner la primera" disabled={idx === 0 || moviendo} onClick={() => mover(l, 'arriba')}>
                      ⤒
                    </button>
                    <button type="button" title="Subir" aria-label="Subir" disabled={idx === 0 || moviendo} onClick={() => mover(l, 'sube')}>
                      ▲
                    </button>
                    <button type="button" title="Bajar" aria-label="Bajar" disabled={idx === mine.length - 1 || moviendo} onClick={() => mover(l, 'baja')}>
                      ▼
                    </button>
                  </span>
                )}
                <button type="button" className="btn btn-small btn-outline" onClick={() => cambiarEstado(l)}>
                  {l.status === 'sold' ? 'Volver a poner en venta' : 'Marcar como vendida'}
                </button>
                <button type="button" className="btn btn-small btn-outline" onClick={() => empezarEdicion(l)}>
                  Editar
                </button>
                <button type="button" className="btn btn-small btn-danger" onClick={() => borrar(l)}>
                  Borrar
                </button>
              </div>
              {vendiendo?.id === l.id && (
                <div className="buyer-picker">
                  <strong>¿A quién se la has vendido?</strong>
                  <p className="muted small" style={{ margin: '4px 0 8px' }}>
                    Busca su nombre o email en AkibaTrade. Así podrá dejarte una reseña que saldrá en tu perfil.
                  </p>
                  <input
                    type="text"
                    placeholder="Nombre o email del comprador…"
                    value={busqueda}
                    onChange={(e) => buscarComprador(e.target.value)}
                  />
                  <div className="buyer-results">
                    {buscando && <span className="muted small">Buscando…</span>}
                    {!buscando && busqueda.trim().length >= 2 && resultados.length === 0 && !ventaMsg && (
                      <span className="muted small">No hay ningún usuario con ese nombre.</span>
                    )}
                    {resultados.map((r) => (
                      <button type="button" key={r.id} className="buyer-result" onClick={() => confirmarVenta(r)}>
                        <strong>{r.display_name}</strong> <span className="muted small">· {r.email_oculto}</span>
                      </button>
                    ))}
                  </div>
                  {ventaMsg && <div className="notice notice-error">{ventaMsg}</div>}
                  <div className="admin-actions">
                    <button type="button" className="btn btn-small btn-outline" onClick={() => confirmarVenta(null)}>
                      Vendida a otra persona / fuera de la web
                    </button>
                    <button type="button" className="btn btn-small btn-outline" onClick={() => setVendiendo(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
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
          <div className="field">
            <label>Foto de perfil</label>
            <div className="avatar-edit">
              <SellerBadge
                id={user.id}
                name={contacto.display_name}
                color={contacto.color}
                avatarUrl={profile.avatar_url}
                size={72}
              />
              <label className="btn btn-small btn-outline" style={{ cursor: 'pointer' }}>
                {subiendoAvatar ? 'Subiendo…' : profile.avatar_url ? 'Cambiar foto' : 'Subir foto'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={subiendoAvatar}
                  onChange={(e) => cambiarAvatar(e.target.files?.[0])}
                />
              </label>
              {profile.avatar_url && (
                <button type="button" className="btn btn-small btn-outline" onClick={quitarAvatar}>
                  Quitar foto
                </button>
              )}
            </div>
            <span className="hint">Se ve en el directorio de vendedores, en el catálogo y en tu tienda.</span>
          </div>
          <div className="field">
            <label>Color de tu tienda</label>
            <div className="swatches">
              {SELLER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch ${sellerColor(user.id, contacto.color) === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                  onClick={() => setContacto({ ...contacto, color: c })}
                />
              ))}
            </div>
            <span className="hint">Con este color te reconocerán en el catálogo y en tu tienda.</span>
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

function FotoCampo({ titulo, file, onChange, actual }) {
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
      ) : actual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={actual} alt={titulo} />
      ) : (
        <div className="photo-empty">{titulo}</div>
      )}
      <label className="btn btn-small btn-outline" style={{ cursor: 'pointer' }}>
        {file || actual ? 'Cambiar foto' : 'Elegir foto'}
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
