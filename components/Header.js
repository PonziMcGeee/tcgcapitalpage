'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import SearchBar from './SearchBar';
import { getSupabase } from '../lib/supabase';
import { isAdmin, isSeller } from '../lib/roles';
import { useProfile } from '../lib/useProfile';

// El buscador va fijo en la cabecera. Si estás en /buscar, enseña lo que has buscado.
function HeaderSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const q = pathname === '/buscar' ? params.get('q') || '' : '';
  return <SearchBar key={`${pathname}|${q}`} initial={q} />;
}

export default function Header() {
  const { user, profile, loading } = useProfile();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const activo = (href) => (pathname === href || pathname.startsWith(href + '/') ? 'active' : '');
  const [abierto, setAbierto] = useState(false);

  async function salir() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setAbierto(false);
    router.push('/');
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="AkibaTrade" className="logo-img" />
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? '✕' : '☰'}
        </button>
        <nav aria-label="Principal" className={`nav ${abierto ? 'open' : ''}`} onClick={() => setAbierto(false)}>
          <Link href="/catalogo" className={`nav-link ${activo('/catalogo')}`}>Cartas</Link>
          <Link href="/vendedores" className={`nav-link ${activo('/vendedores') || activo('/tienda')}`}>Vendedores</Link>
          {!loading && !isSeller(profile) && (
            <Link href="/conviertete-en-vendedor" className="nav-seller">
              Conviértete en vendedor
            </Link>
          )}
          {!loading && user && <Link href="/favoritos" className={`nav-link ${activo('/favoritos')}`}>Favoritos
          </Link>}
          {!loading && user && <Link href="/mis-compras" className={`nav-link ${activo('/mis-compras')}`}>Mis compras</Link>}
          {!loading && isSeller(profile) && <Link href="/vendedor" className={`nav-link ${activo('/vendedor')}`}>Mi panel</Link>}
          {!loading && isAdmin(profile) && <Link href="/admin" className={`nav-link ${activo('/admin')}`}>Admin</Link>}
          {!loading && !user && (
            <>
              <Link href="/login" className={`nav-link ${activo('/login')}`}>Entrar</Link>
              <Link href="/registro" className="btn btn-small nav-cta">
                Crear cuenta
              </Link>
            </>
          )}
          {!loading && user && (
            <button type="button" className="link-button nav-link nav-exit" onClick={salir}>
              Salir
            </button>
          )}
        </nav>
      </div>
      <div className="header-searchband">
        <div className="container header-search">
          <Suspense fallback={<div className="searchbar searchbar-ph" aria-hidden="true" />}>
            <HeaderSearch />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
