import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Link from 'next/link';
import Header from '../components/Header';

export const metadata = {
  metadataBase: new URL('https://www.akibatrade.com'),
  title: { default: 'AkibaTrade · Cartas TCG japonesas y Pokémon vintage', template: '%s · AkibaTrade' },
  description: 'Marketplace de cartas TCG, especializado en Pokémon vintage y cartas japonesas. Vendedores contrastados, trato directo y envíos a España y Europa.',
  applicationName: 'AkibaTrade',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'AkibaTrade',
    locale: 'es_ES',
    title: 'AkibaTrade · Cartas TCG japonesas y Pokémon vintage',
    description: 'Marketplace de cartas TCG, especializado en Pokémon vintage y cartas japonesas. Vendedores contrastados, trato directo y envíos a España y Europa.',
    url: '/',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AkibaTrade · Cartas TCG japonesas y Pokémon vintage' }],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                { '@type': 'Organization', name: 'AkibaTrade', description: 'Marketplace de cartas TCG, especializado en Pokémon vintage y cartas japonesas. Vendedores contrastados, trato directo y envíos a España y Europa.', url: 'https://www.akibatrade.com', logo: 'https://www.akibatrade.com/logo.png', email: 'contacto@akibatrade.com' },
                {
                  '@type': 'WebSite',
                  name: 'AkibaTrade',
                  url: 'https://www.akibatrade.com',
                  inLanguage: 'es',
                  potentialAction: { '@type': 'SearchAction', target: 'https://www.akibatrade.com/buscar?q={search_term_string}', 'query-input': 'required name=search_term_string' },
                },
              ],
            }),
          }}
        />
        <Header />
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container footer-inner">
            <Link href="/contacto" className="btn btn-small footer-contact">
              Contacto
            </Link>
            <nav className="footer-legal" aria-label="Información legal">
              <Link href="/aviso-legal">Aviso legal</Link>
              <span aria-hidden="true">·</span>
              <Link href="/privacidad">Política de privacidad</Link>
              <span aria-hidden="true">·</span>
              <Link href="/cookies">Política de cookies</Link>
              <span aria-hidden="true">·</span>
              <Link href="/condiciones">Condiciones de uso</Link>
            </nav>
            <p className="footer-copy">© 2026 AkibaTrade. Todos los derechos reservados.</p>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
