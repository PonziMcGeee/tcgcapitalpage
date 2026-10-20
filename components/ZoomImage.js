'use client';

import { useEffect, useState } from 'react';

// Foto con zoom para ordenador: al pasar el ratón se amplía siguiendo el cursor,
// y al hacer clic se abre a pantalla completa (Esc o clic para cerrar).
export default function ZoomImage({ src, alt }) {
  const [origen, setOrigen] = useState('50% 50%');
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (!abierta) return undefined;
    const tecla = (e) => e.key === 'Escape' && setAbierta(false);
    window.addEventListener('keydown', tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tecla);
      document.body.style.overflow = antes;
    };
  }, [abierta]);

  function mover(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigen(`${x}% ${y}%`);
  }

  return (
    <>
      <div className="zoom-box" onMouseMove={mover} onClick={() => setAbierta(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ transformOrigin: origen }} />
      </div>
      {abierta && (
        <div className="lightbox" onClick={() => setAbierta(false)} role="dialog" aria-label={alt}>
          <button type="button" className="lightbox-close" aria-label="Cerrar" onClick={() => setAbierta(false)}>
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} />
        </div>
      )}
    </>
  );
}
