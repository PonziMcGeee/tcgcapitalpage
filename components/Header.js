'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../lib/supabase';
import { useProfile } from '../lib/useProfile';

export default function Header() {
  const { user, profile, loading } = useProfile();
  const router = useRouter();

  async function salir() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    router.push('/');
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          TCG <span>Capital</span>
        </Link>
        <nav className="nav">
          <Link href="/">Inicio</Link>
          <Link href="/catalogo">Catálogo</Link>
          {!loading && profile?.role === 'seller' && <Link href="/vendedor">Mi panel</Link>}
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
