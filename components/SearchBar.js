'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Buscador general: lleva a /buscar con lo escrito (cartas, colecciones y vendedores)
export default function SearchBar({ initial = '', autoFocus = false }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function enviar(e) {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/buscar?q=${encodeURIComponent(t)}` : '/buscar');
  }

  return (
    <form className="searchbar" role="search" onSubmit={enviar}>
      <svg className="searchbar-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Busca por Pokémon, vendedor o colección…"
        aria-label="Buscar cartas, vendedores o colecciones"
        autoFocus={autoFocus}
      />
      <button type="submit" className="searchbar-btn">
        Buscar
      </button>
    </form>
  );
}
