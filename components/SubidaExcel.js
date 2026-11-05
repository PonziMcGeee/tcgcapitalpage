'use client';

import { useState } from 'react';
import { MAX_FILAS, leerMatriz, NOMBRE_HOJA, validarFilas } from '../lib/importar.js';
import { getSupabase } from '../lib/supabase';

// Subida de varias cartas (hasta 10) desde la plantilla Excel.
// Primero se revisa TODO; si hay un solo error, no se sube nada.
export default function SubidaExcel({ user, profile, mine, subirFoto, onTerminado }) {
  const [excel, setExcel] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [errores, setErrores] = useState([]);
  const [cartas, setCartas] = useState(null); // cartas ya validadas, listas para subir
  const [sinUsar, setSinUsar] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progreso, setProgreso] = useState('');

  function reiniciarRevision() {
    setErrores([]);
    setCartas(null);
    setSinUsar([]);
    setMsg(null);
  }

  async function revisar() {
    reiniciarRevision();
    if (!excel) {
      setMsg({ type: 'error', text: 'Elige primero el archivo Excel.' });
      return;
    }
    if (!fotos.length) {
      setMsg({ type: 'error', text: 'Selecciona también las fotos de las cartas.' });
      return;
    }
    setBusy(true);
    try {
      const { readSheet } = await import('read-excel-file/browser');
      let matriz;
      try {
        matriz = await readSheet(excel, NOMBRE_HOJA);
      } catch {
        setErrores([{ fila: 0, columna: '', mensaje: `No se ha podido leer el Excel. Usa la plantilla oficial (.xlsx) y rellena la hoja «${NOMBRE_HOJA}».` }]);
        setBusy(false);
        return;
      }
      const lectura = leerMatriz(matriz);
      if (lectura.errores.length) {
        setErrores(lectura.errores);
        setBusy(false);
        return;
      }
      const archivos = new Map(fotos.map((f) => [f.name.toLowerCase(), f]));
      const r = validarFilas(lectura.filas, archivos);
      setErrores(r.errores);
      setSinUsar(r.fotosSinUsar || []);
      if (!r.errores.length) setCartas(r.cartas);
    } catch {
      setErrores([{ fila: 0, columna: '', mensaje: 'Ha ocurrido un error al revisar el Excel. Inténtalo de nuevo.' }]);
    }
    setBusy(false);
  }

  async function publicar() {
    if (!cartas?.length) return;
    const sb = getSupabase();
    setBusy(true);
    setMsg(null);
    const nums = mine.map((l) => l.sort_order).filter((n) => typeof n === 'number');
    const inicio = (nums.length ? Math.min(...nums) : 0) - cartas.length;
    let hechas = 0;
    for (let i = 0; i < cartas.length; i++) {
      const c = cartas[i];
      setProgreso(`Subiendo carta ${i + 1} de ${cartas.length}: ${c.datos.name}…`);
      try {
        const front_url = await subirFoto(c.front, 'front');
        const back_url = await subirFoto(c.back, 'back');
        const thumb_url = await subirFoto(c.front, 'thumb');
        const { error } = await sb.from('listings').insert({
          seller_id: user.id,
          sort_order: inicio + i,
          seller_name: profile.display_name || user.email.split('@')[0],
          ...c.datos,
          front_url,
          back_url,
          thumb_url,
        });
        if (error) throw error;
        hechas++;
      } catch {
        setMsg({
          type: 'error',
          text: `Fallo al subir la fila ${c.fila} («${c.datos.name}»). Se han publicado ${hechas} de ${cartas.length}. Revisa «Mis cartas», quita de tu Excel las ya publicadas y vuelve a intentarlo con el resto.`,
        });
        setBusy(false);
        setProgreso('');
        setCartas(null);
        onTerminado?.();
        return;
      }
    }
    setBusy(false);
    setProgreso('');
    setCartas(null);
    setExcel(null);
    setFotos([]);
    setMsg({ type: 'ok', text: `¡${hechas} cartas publicadas! Ya aparecen en el catálogo.` });
    onTerminado?.();
  }

  return (
    <section className="panel">
      <details>
        <summary>
          <strong>Subir varias cartas con Excel (hasta {MAX_FILAS} de golpe)</strong>
        </summary>
        <div className="form" style={{ marginTop: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              padding: 14,
              borderRadius: 10,
              border: '2px dashed currentColor',
            }}
          >
            <span>
              <strong>Paso 1:</strong> descarga la plantilla y rellénala
            </span>
            <a className="btn" href="/plantilla-cartas.xlsx" download>
              ⬇ Descargar plantilla Excel
            </a>
          </div>
          <ol className="muted" style={{ paddingLeft: 18, lineHeight: 1.6 }} start={2}>
            <li>Rellena una fila por carta. En «Foto delante» y «Foto detrás» escribe el nombre del archivo, con su extensión (por ejemplo <em>charizard-delante.jpg</em>).</li>
            <li>Elige aquí abajo el Excel y, a la vez, todas las fotos.</li>
            <li>Pulsa «Revisar». Si hay algún error no se sube nada; corrígelo en el Excel y vuelve a revisar.</li>
          </ol>

          <label>
            Archivo Excel (.xlsx)
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                setExcel(e.target.files?.[0] || null);
                reiniciarRevision();
              }}
            />
          </label>
          <label>
            Fotos de las cartas (puedes elegir varias a la vez)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                setFotos(Array.from(e.target.files || []));
                reiniciarRevision();
              }}
            />
          </label>
          {fotos.length > 0 && <p className="muted">{fotos.length} fotos seleccionadas.</p>}

          <div>
            <button type="button" className="btn" onClick={revisar} disabled={busy}>
              {busy && !progreso ? 'Revisando…' : 'Revisar Excel'}
            </button>
          </div>

          {msg && <div className={`notice ${msg.type === 'ok' ? 'notice-ok' : 'notice-error'}`}>{msg.text}</div>}

          {errores.length > 0 && (
            <div className="notice notice-error">
              <strong>
                Hay {errores.length} {errores.length === 1 ? 'error' : 'errores'}. No se puede subir hasta corregirlos:
              </strong>
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>Fila</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>Columna</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>Problema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errores.map((e, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 8px' }}>{e.fila || '—'}</td>
                        <td style={{ padding: '4px 8px' }}>{e.columna || '—'}</td>
                        <td style={{ padding: '4px 8px' }}>{e.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {cartas && (
            <div className="notice notice-ok">
              <strong>Todo correcto: {cartas.length} {cartas.length === 1 ? 'carta lista' : 'cartas listas'} para publicar.</strong>
              <ul style={{ margin: '8px 0', paddingLeft: 18 }}>
                {cartas.map((c) => (
                  <li key={c.fila}>
                    {c.datos.name} · {c.datos.game} · {c.datos.price} €
                  </li>
                ))}
              </ul>
              {sinUsar.length > 0 && (
                <p className="muted">Fotos seleccionadas que no se usan en el Excel (se ignoran): {sinUsar.join(', ')}</p>
              )}
              <button type="button" className="btn" onClick={publicar} disabled={busy}>
                {busy ? 'Publicando…' : `Publicar ${cartas.length} ${cartas.length === 1 ? 'carta' : 'cartas'}`}
              </button>
            </div>
          )}
          {progreso && <p className="muted">{progreso}</p>}
        </div>
      </details>
    </section>
  );
}
