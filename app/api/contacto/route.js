import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const DESTINO = process.env.CONTACT_TO || 'contacto@akibatrade.com';
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Límite sencillo por IP (en memoria; suficiente contra abusos básicos)
const recientes = new Map();

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Datos no válidos.' }, { status: 400 });
  }
  // Campo trampa para bots: si viene relleno, se responde "ok" sin enviar nada
  if (body.web) return Response.json({ ok: true });

  const nombre = String(body.nombre || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 200);
  const contacto = String(body.contacto || '').trim().slice(0, 200);
  const juegos = Array.isArray(body.juegos) ? body.juegos.map((j) => String(j).slice(0, 40)).slice(0, 5) : [];
  const experiencia = String(body.experiencia || '').trim().slice(0, 300);
  const tipo = body.tipo === 'general' ? 'general' : 'vendedor';
  const motivo = String(body.motivo || '').trim().slice(0, 80);
  const mensaje = String(body.mensaje || '').trim().slice(0, 3000);

  if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || mensaje.length < 10) {
    return Response.json({ error: 'Revisa el nombre, el email y el mensaje.' }, { status: 400 });
  }

  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  const ahora = Date.now();
  const ultimos = (recientes.get(ip) || []).filter((t) => ahora - t < 10 * 60 * 1000);
  if (ultimos.length >= 3) {
    return Response.json({ error: 'Has enviado demasiados mensajes. Inténtalo más tarde.' }, { status: 429 });
  }
  recientes.set(ip, [...ultimos, ahora]);

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return Response.json({ error: 'El envío de correo no está configurado todavía.' }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass },
  });

  const lineas =
    tipo === 'general'
      ? [
          ['Nombre', nombre],
          ['Email', email],
          ['Motivo', motivo || '—'],
        ]
      : [
          ['Nombre', nombre],
          ['Email', email],
          ['Telegram / WhatsApp / Instagram', contacto || '—'],
          ['Juegos que vende', juegos.join(', ') || '—'],
          ['Experiencia', experiencia || '—'],
        ];
  const texto = lineas.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nMensaje:\n${mensaje}`;
  const html =
    lineas.map(([k, v]) => `<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join('') +
    `<p><b>Mensaje:</b></p><p style="white-space:pre-wrap">${esc(mensaje)}</p>`;

  try {
    await transporter.sendMail({
      from: `"AkibaTrade web" <${user}>`,
      to: DESTINO,
      replyTo: `"${nombre.replace(/"/g, '')}" <${email}>`,
      subject: tipo === 'general' ? `[Contacto web] ${motivo || 'Mensaje'} — ${nombre}` : `Nuevo vendedor interesado: ${nombre}`,
      text: texto,
      html,
    });
  } catch (err) {
    console.error('Error enviando correo de contacto:', err?.message);
    return Response.json({ error: 'No se ha podido enviar el mensaje. Inténtalo de nuevo en unos minutos.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
