import './globals.css';
import Header from '../components/Header';
import { Analytics } from '@vercel/analytics/next';

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
      </body>
    </html>
  );
}
