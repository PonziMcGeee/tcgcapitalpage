'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const limpiar = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Desplegable con buscador: se escribe para filtrar y se elige con clic o con Enter.
// options: [{ value, label }]. value '' = sin elegir (emptyLabel).
export default function SearchSelect({ id, value, onChange, options, emptyLabel = 'Sin indicar', placeholder = 'Buscar…' }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [indice, setIndice] = useState(0);
  const caja = useRef(null);

  const actual = options.find((o) => o.value === value);

  const filtradas = useMemo(() => {
    const q = limpiar(texto.trim());
    return options.filter((o) => !q || limpiar(o.label).includes(q));
  }, [options, texto]);

  useEffect(() => {
    setIndice(0);
  }, [texto, abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => {
      if (caja.current && !caja.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('touchstart', fuera);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('touchstart', fuera);
    };
  }, [abierto]);

  function elegir(v) {
    onChange(v);
    setTexto('');
    setAbierto(false);
  }

  function teclas(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setIndice((i) => Math.min(i + 1, filtradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndice((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && abierto) {
      e.preventDefault();
      if (filtradas[indice]) elegir(filtradas[indice].value);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  }

  return (
    <div className="ss" ref={caja}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={abierto}
        value={abierto ? texto : actual ? actual.label : ''}
        placeholder={abierto ? placeholder : emptyLabel}
        onFocus={() => setAbierto(true)}
        onClick={() => setAbierto(true)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onKeyDown={teclas}
      />
      {value && !abierto && (
        <button type="button" className="ss-clear" aria-label="Quitar selección" onClick={() => elegir('')}>
          ✕
        </button>
      )}
      {abierto && (
        <ul className="ss-list" role="listbox">
          <li>
            <button type="button" className={!value ? 'sel' : ''} onClick={() => elegir('')}>
              {emptyLabel}
            </button>
          </li>
          {filtradas.map((o, i) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`${o.value === value ? 'sel' : ''} ${i === indice ? 'hl' : ''}`}
                onClick={() => elegir(o.value)}
              >
                {o.label}
              </button>
            </li>
          ))}
          {filtradas.length === 0 && <li className="ss-empty">No hay ninguna colección con ese nombre</li>}
        </ul>
      )}
    </div>
  );
}
