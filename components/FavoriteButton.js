'use client';

import { useFavorites } from '../lib/useFavorites';

// Corazón para guardar una carta (kind="card") o un vendedor (kind="seller") en favoritos.
export default function FavoriteButton({ kind, id, label = '', className = '' }) {
  const { isFav, toggle } = useFavorites();
  const activo = isFav(kind, id);

  function pulsar(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle(kind, id);
  }

  return (
    <button
      type="button"
      className={`fav-btn ${activo ? 'active' : ''} ${className}`}
      onClick={pulsar}
      aria-pressed={activo}
      aria-label={activo ? `Quitar ${label} de favoritos` : `Añadir ${label} a favoritos`}
      title={activo ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6.1 5c2 0 3.2 1 3.9 2.2h.0C10.7 6 11.9 5 13.9 5c3.4 0 5.2 3.4 3.7 6.8C19.5 16.4 12 21 12 21z" transform="translate(0 .5)" />
      </svg>
    </button>
  );
}
