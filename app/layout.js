import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Link from 'next/link';
import Header from '../components/Header';

export const metadata = {
  metadataBase: new URL('https://akibatrade.com'),
  title: { default: 'AkibaTrade · Cartas TCG japonesas y vintage', template: '%s · AkibaTrade' },
  description: 'Compra cartas TCG japonesas y vintage directamente a vendedores contrastados. Envíos a España y Europa.',
  applicationName: 'AkibaTrade',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'AkibaTrade',
    locale: 'es_ES',
    title: 'AkibaTrade · Cartas TCG japonesas y vintage',
    description: 'Compra cartas TCG japonesas y vintage directamente a vendedores contrastados. Envíos a España y Europa.',
    url: '/',
    images: [{ url: '/logo.png', alt: 'AkibaTrade' }],
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
                { '@type': 'Organization', name: 'AkibaTrade', url: 'https://akibatrade.com', logo: 'https://akibatrade.com/logo.png', email: 'contacto@akibatrade.com' },
                {
                  '@type': 'WebSite',
                  name: 'AkibaTrade',
                  url: 'https://akibatrade.com',
                  inLanguage: 'es',
                  potentialAction: { '@type': 'SearchAction', target: 'https://akibatrade.com/buscar?q={search_term_string}', 'query-input': 'required name=search_term_string' },
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
