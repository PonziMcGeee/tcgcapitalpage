'use client';

import Link from 'next/link';
import { useState } from 'react';
import BannersAdmin from '../../components/admin/BannersAdmin';
import CollectionsAdmin from '../../components/admin/CollectionsAdmin';
import ListingsAdmin from '../../components/admin/ListingsAdmin';
import UsersAdmin from '../../components/admin/UsersAdmin';
import ConfigWarning from '../../components/ConfigWarning';
import { isAdmin } from '../../lib/roles';
import { useProfile } from '../../lib/useProfile';

const PESTANAS = [
  { id: 'usuarios', texto: 'Usuarios' },
  { id: 'cartas', texto: 'Cartas' },
  { id: 'banners', texto: 'Banners' },
  { id: 'carruseles', texto: 'Carruseles' },
];

export default function Admin() {
  const { user, profile, loading } = useProfile();
  const [pestana, setPestana] = useState('usuarios');
  const [vendedorFiltro, setVendedorFiltro] = useState('');

  if (loading) return <p className="muted">Cargando…</p>;

  if (!user) {
    return (
      <div className="empty">
        Tienes que entrar para ver esta página. <Link href="/login">Entrar</Link>
      </div>
    );
  }

  if (!isAdmin(profile)) {
    return <div className="empty">Esta página es solo para administradores.</div>;
  }

  return (
    <>
      <ConfigWarning />
      <h1>Administración</h1>
      <p className="muted">Aquí gestionas quién puede vender, qué cartas se publican y qué se ve en la portada.</p>

      <div className="tabs" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            className={pestana === p.id ? 'active' : ''}
            onClick={() => {
              if (p.id === 'cartas' && pestana !== 'cartas') setVendedorFiltro('');
              setPestana(p.id);
            }}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {pestana === 'usuarios' && (
        <UsersAdmin
          onVerCartas={(u) => {
            setVendedorFiltro(u.id);
            setPestana('cartas');
          }}
        />
      )}
      {pestana === 'cartas' && <ListingsAdmin key={vendedorFiltro} vendedorInicial={vendedorFiltro} />}
      {pestana === 'banners' && <BannersAdmin />}
      {pestana === 'carruseles' && <CollectionsAdmin />}
    </>
  );
}
