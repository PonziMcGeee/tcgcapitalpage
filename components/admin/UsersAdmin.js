'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

const ETIQUETAS = { buyer: 'Comprador', seller: 'Vendedor', admin: 'Administrador' };
const MAX_VISIBLES = 50;

// Lista de usuarios. El administrador puede pasar a un comprador a vendedor, y al revés.
export default function UsersAdmin({ onVerCartas }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(async () => {
    const sb = getSupabase();
    const { data, error: err } = await sb.rpc('admin_list_users');
    if (err) {
      setError('No se ha podido cargar la lista de usuarios. ¿Has ejecutado la migración de Supabase y eres administrador?');
    } else {
      setUsers(data);
      setError('');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarRol(usuario, role) {
    if (
      role === 'buyer' &&
      !window.confirm(
        `¿Quitar a ${usuario.display_name || usuario.email} como vendedor? Dejará de poder vender y sus cartas dejarán de verse en la web (no se borran; si vuelve a ser vendedor, reaparecen).`
      )
    )
      return;
    const sb = getSupabase();
    setMsg(null);
    const { error: err } = await sb.from('profiles').update({ role }).eq('id', usuario.id);
    if (err) {
      setMsg({ type: 'error', text: 'No se ha podido cambiar el rol.' });
      return;
    }
    setMsg({
      type: 'ok',
      text:
        role === 'seller'
          ? `${usuario.display_name || usuario.email} ya es vendedor. Verá "Mi panel" al volver a entrar.`
          : `${usuario.display_name || usuario.email} vuelve a ser comprador.`,
    });
    cargar();
  }

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filtro && u.role !== filtro) return false;
      if (!q) return true;
      return (u.email || '').toLowerCase().includes(q) || (u.display_name || '').toLowerCase().includes(q);
    });
  }, [users, search, filtro]);

  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>
        Busca a la persona por su nombre o email y conviértela en vendedora. Tiene que haberse registrado antes.
      </p>

      <div className="filters filters-2">
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="buyer">Compradores</option>
          <option value="seller">Vendedores</option>
          <option value="admin">Administradores</option>
        </select>
      </div>

      {msg && <div className={`notice ${msg.type === 'ok' ? 'notice-ok' : 'notice-error'}`}>{msg.text}</div>}
      {error && <div className="notice notice-error">{error}</div>}
      {loading && <p className="muted">Cargando…</p>}

      <div className="admin-list">
        {filtrados.slice(0, MAX_VISIBLES).map((u) => (
          <div className="admin-row" key={u.id}>
            <div className="admin-row-main">
              <strong>{u.display_name || 'Sin nombre'}</strong>
              <p className="muted small">{u.email}</p>
            </div>
            <span className={`role-tag ${u.role}`}>{ETIQUETAS[u.role] || u.role}</span>
            <div className="admin-actions">
              {u.role === 'buyer' && (
                <button type="button" className="btn btn-small" onClick={() => cambiarRol(u, 'seller')}>
                  Hacer vendedor
                </button>
              )}
              {(u.role === 'seller' || u.role === 'admin') && onVerCartas && (
                <button type="button" className="btn btn-small btn-outline" onClick={() => onVerCartas(u)}>
                  Ver cartas
                </button>
              )}
              {u.role === 'seller' && (
                <button type="button" className="btn btn-small btn-outline" onClick={() => cambiarRol(u, 'buyer')}>
                  Quitar vendedor
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && filtrados.length === 0 && <div className="empty">No hay usuarios que coincidan.</div>}
      {filtrados.length > MAX_VISIBLES && (
        <p className="muted small" style={{ marginTop: 12 }}>
          Se muestran {MAX_VISIBLES} de {filtrados.length}. Usa el buscador para encontrar a alguien concreto.
        </p>
      )}
    </>
  );
}
