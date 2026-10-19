'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from './supabase';

// Almacén compartido: todos los corazones de la página usan los mismos datos.
const store = { userId: null, cards: new Set(), sellers: new Set(), loaded: false, listeners: new Set() };

function emit() {
  store.listeners.forEach((fn) => fn());
}

async function cargar() {
  const sb = getSupabase();
  if (!sb) {
    store.loaded = true;
    emit();
    return;
  }
  const {
    data: { session },
  } = await sb.auth.getSession();
  const uid = session?.user?.id || null;
  if (!uid) {
    store.userId = null;
    store.cards = new Set();
    store.sellers = new Set();
    store.loaded = true;
    emit();
    return;
  }
  const { data } = await sb.from('favorites').select('kind, target_id').eq('user_id', uid);
  store.userId = uid;
  store.cards = new Set((data || []).filter((f) => f.kind === 'card').map((f) => f.target_id));
  store.sellers = new Set((data || []).filter((f) => f.kind === 'seller').map((f) => f.target_id));
  store.loaded = true;
  emit();
}

let iniciado = false;
function iniciar() {
  if (iniciado) return;
  iniciado = true;
  cargar();
  const sb = getSupabase();
  if (sb) sb.auth.onAuthStateChange(() => setTimeout(cargar, 0));
}

export function useFavorites() {
  const router = useRouter();
  const [, forzar] = useState(0);

  useEffect(() => {
    iniciar();
    const fn = () => forzar((n) => n + 1);
    store.listeners.add(fn);
    return () => store.listeners.delete(fn);
  }, []);

  const toggle = useCallback(
    async (kind, id) => {
      const sb = getSupabase();
      if (!sb) return;
      if (!store.userId) {
        router.push('/login');
        return;
      }
      const set = kind === 'card' ? store.cards : store.sellers;
      const estaba = set.has(id);
      // Cambio inmediato en pantalla; si falla se deshace
      if (estaba) set.delete(id);
      else set.add(id);
      emit();
      const q = estaba
        ? sb.from('favorites').delete().eq('user_id', store.userId).eq('kind', kind).eq('target_id', id)
        : sb.from('favorites').insert({ user_id: store.userId, kind, target_id: id });
      const { error } = await q;
      if (error) {
        if (estaba) set.add(id);
        else set.delete(id);
        emit();
      }
    },
    [router]
  );

  return {
    loaded: store.loaded,
    logged: !!store.userId,
    cards: store.cards,
    sellers: store.sellers,
    isFav: (kind, id) => (kind === 'card' ? store.cards : store.sellers).has(id),
    toggle,
  };
}
