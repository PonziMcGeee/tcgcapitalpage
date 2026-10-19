'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { isAdmin, isSeller } from '../lib/roles';
import { useProfile } from '../lib/useProfile';

export default function Header() {
  const { user, profile, loading } = useProfile();
  const router = useRouter();
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
        <nav className={`nav ${abierto ? 'open' : ''}`} onClick={() => setAbierto(false)}>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/vendedores">Vendedores</Link>
          <a href="https://t.me/tcgcapital_esp" target="_blank" rel="noreferrer" className="nav-seller">
            Conviértete en vendedor
          </a>
          {!loading && user && <Link href="/favoritos">♥ Favoritos</Link>}
          {!loading && isSeller(profile) && <Link href="/vendedor">Mi panel</Link>}
          {!loading && isAdmin(profile) && <Link href="/admin">Admin</Link>}
          {!loading && !user && (
            <>
              <Link href="/login">Entrar</Link>
              <Link href="/registro" className="btn btn-small">
                Crear cuenta
              </Link>
            </>
          )}
          {!loading && user && (
            <button type="button" className="link-button" onClick={salir}>
              Salir
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
