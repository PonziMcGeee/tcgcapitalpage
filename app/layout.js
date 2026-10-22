import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Link from 'next/link';
import Header from '../components/Header';

export const metadata = {
  title: 'AkibaTrade',
  description: 'Compra cartas Pokémon y One Piece japonesas y vintage directamente a vendedores contrastados. Envíos a España y Europa.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container footer-inner">
            <Link href="/contacto" className="btn btn-small footer-contact">
              Contacto
            </Link>
            <p className="footer-copy">© 2026 AkibaTrade. Todos los derechos reservados.</p>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
