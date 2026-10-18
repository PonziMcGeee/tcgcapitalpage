import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

let client = null;

// Devuelve el cliente de Supabase, o null si todavía no se han puesto las claves.
export function getSupabase() {
  if (!isConfigured) return null;
  if (!client) client = createClient(url, key);
  return client;
}
