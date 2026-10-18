'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from './supabase';

// Devuelve el usuario con sesión iniciada y su perfil (rol, datos de contacto).
export function useProfile() {
  const [state, setState] = useState({ loading: true, user: null, profile: null });

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setState({ loading: false, user: null, profile: null });
      return;
    }
    const {
      data: { session },
    } = await sb.auth.getSession();
    const user = session?.user ?? null;
    let profile = null;
    if (user) {
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      profile = data;
    }
    setState({ loading: false, user, profile });
  }, []);

  useEffect(() => {
    load();
    const sb = getSupabase();
    if (!sb) return undefined;
    const { data } = sb.auth.onAuthStateChange(() => {
      setTimeout(load, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  return { ...state, reload: load };
}
