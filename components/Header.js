'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { isAdmin, isSeller } from '../lib/roles';
import { useProfile } from '../lib/useProfile';

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
          <a href="https://t.me/tcgcapital_esp" target="_blank" rel="noreferrer" className="nav-seller">
            Conviértete en vendedor
          </a>
          {!loading && user && <Link href="/favoritos" className={`nav-link ${activo('/favoritos')}`}><svg className="nav-heart" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Favoritos
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
    </header>
  );
}
