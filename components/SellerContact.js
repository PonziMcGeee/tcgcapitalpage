import { instagramUrl, telegramUrl, whatsappUrl } from '../lib/format';

// Botones para escribir al vendedor. `seller` es su perfil (null mientras carga).
export default function SellerContact({ seller }) {
  if (!seller) return <p className="muted small">Cargando contacto…</p>;

  const wa = whatsappUrl(seller.phone);
  const tg = telegramUrl(seller.telegram);
  const ig = instagramUrl(seller.instagram);

  if (!wa && !tg && !ig) {
    return <p className="muted small">El vendedor aún no ha añadido datos de contacto.</p>;
  }

  return (
    <>
      {wa && (
        <a className="btn btn-outline" href={wa} target="_blank" rel="noreferrer">
          Hablar por WhatsApp
        </a>
      )}
      {tg && (
        <a className="btn btn-outline" href={tg} target="_blank" rel="noreferrer">
          Hablar por Telegram
        </a>
      )}
      {ig && (
        <a className="btn btn-outline" href={ig} target="_blank" rel="noreferrer">
          Hablar por Instagram
        </a>
      )}
    </>
  );
}
