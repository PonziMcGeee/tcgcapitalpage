// Reduce el peso de las fotos que ya están en Supabase Storage (bucket «cards»).
// Las vuelve a guardar en la MISMA ruta (así no cambia ninguna dirección) más ligeras
// (miniaturas y traseras en WebP, delantera en JPEG), y solo si el ahorro compensa. Por defecto solo SIMULA (no cambia nada).
//
// Uso (desde la carpeta del proyecto):
//   npm i --no-save sharp
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/optimizar-imagenes.mjs          # simulación
//   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=... node scripts/optimizar-imagenes.mjs --apply                      # aplica
//   Opciones: --limit=20 (solo las primeras 20 cartas, para probar)
// La clave «service_role» está en Supabase > Project Settings > API. NO la subas a GitHub ni la compartas.
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apply = process.argv.includes('--apply');
const limit = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
const BUCKET = 'cards';
// Tamaño máximo (lado mayor) y calidad según el tipo de foto
// La foto de delante sigue en JPEG (es la que usan WhatsApp, Telegram y Google como vista previa al compartir);
// las miniaturas y las traseras pasan a WebP, que pesa menos.
const AJUSTES = {
  thumb: { max: 360, quality: 70, formato: 'webp' },
  front: { max: 1000, quality: 78, formato: 'jpeg' },
  back: { max: 1000, quality: 78, formato: 'webp' },
};
const AHORRO_MINIMO = 0.12; // solo se reemplaza si la foto nueva pesa al menos un 12 % menos

if (!url || !key) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// Convierte una foto (devuelve null si no merece la pena cambiarla)
export async function optimizar(buffer, tipo) {
  const { max, quality, formato } = AJUSTES[tipo];
  const base = sharp(buffer).rotate().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true });
  const nuevo = await (formato === 'webp' ? base.webp({ quality, effort: 5 }) : base.jpeg({ quality, mozjpeg: true })).toBuffer();
  return nuevo.length <= buffer.length * (1 - AHORRO_MINIMO) ? nuevo : null;
}

const rutaDe = (u) => (u && u.includes(`/object/public/${BUCKET}/`) ? decodeURIComponent(u.split(`/object/public/${BUCKET}/`)[1].split('?')[0]) : null);
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function cartas() {
  let todas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await sb.from('listings').select('id, front_url, back_url, thumb_url').order('created_at').range(desde, desde + 999);
    if (error) throw error;
    todas = todas.concat(data);
    if (data.length < 1000) break;
  }
  return todas;
}

async function main() {
  const lista = (await cartas()).slice(0, limit);
  const tareas = [];
  lista.forEach((l) => {
    [['thumb', l.thumb_url], ['front', l.front_url], ['back', l.back_url]].forEach(([tipo, u]) => {
      const ruta = rutaDe(u);
      if (ruta) tareas.push({ tipo, ruta, url: u });
    });
  });
  console.log(`${lista.length} cartas, ${tareas.length} fotos. ${apply ? 'APLICANDO cambios' : 'SIMULACIÓN (no se cambia nada; usa --apply para aplicar)'}\n`);

  let antes = 0;
  let despues = 0;
  let cambiadas = 0;
  let fallos = 0;
  for (const [i, t] of tareas.entries()) {
    try {
      const res = await fetch(t.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const original = Buffer.from(await res.arrayBuffer());
      const nuevo = await optimizar(original, t.tipo);
      antes += original.length;
      if (!nuevo) {
        despues += original.length;
      } else {
        despues += nuevo.length;
        cambiadas += 1;
        if (apply) {
          const { error } = await sb.storage.from(BUCKET).upload(t.ruta, nuevo, { contentType: AJUSTES[t.tipo].formato === 'webp' ? 'image/webp' : 'image/jpeg', cacheControl: '31536000', upsert: true });
          if (error) throw error;
        }
      }
      if ((i + 1) % 25 === 0 || i === tareas.length - 1) console.log(`  ${i + 1}/${tareas.length}  ${kb(antes)} -> ${kb(despues)}`);
    } catch (e) {
      fallos += 1;
      console.log(`  ! ${t.ruta}: ${e.message}`);
    }
  }
  const ahorro = antes ? Math.round((1 - despues / antes) * 100) : 0;
  console.log(`\nFotos ${apply ? 'reemplazadas' : 'que se reemplazarían'}: ${cambiadas}. Fallos: ${fallos}.`);
  console.log(`Peso: ${kb(antes)} -> ${kb(despues)} (${ahorro}% menos).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
