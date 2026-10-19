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
      <svg viewBox="0 0 24 24" width="22" height="22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
