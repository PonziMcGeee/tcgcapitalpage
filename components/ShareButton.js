'use client';

import { useState } from 'react';

// Botón redondo para compartir el perfil de un vendedor.
// En móvil abre el menú de compartir del sistema; en ordenador copia el enlace.
export default function ShareButton({ path, title }) {
  const [copiado, setCopiado] = useState(false);

  async function compartir(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // el usuario cerró el menú
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const t = document.createElement('textarea');
      t.value = url;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <span className="share-wrap">
      <button type="button" className="share-btn" onClick={compartir} aria-label={`Compartir ${title}`} title="Compartir perfil">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V3" />
          <path d="M8 7l4-4 4 4" />
          <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        </svg>
      </button>
      {copiado && (
        <span className="share-toast" role="status">
          ¡Enlace copiado!
        </span>
      )}
    </span>
  );
}
