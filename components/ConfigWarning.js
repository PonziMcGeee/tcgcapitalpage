import { isConfigured } from '../lib/supabase';

export default function ConfigWarning() {
  if (isConfigured) return null;
  return (
    <div className="notice notice-warn">
      <strong>Falta conectar la base de datos.</strong> Copia <code>.env.example</code> a{' '}
      <code>.env.local</code> y pon las claves de Supabase (mira el README).
    </div>
  );
}
