import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Header from '../components/Header';

export const metadata = {
  title: 'AkibaTrade',
  description: 'Compra y venta de cartas TCG',
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
          <div className="container">AkibaTrade · Envíos a España y Europa</div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
