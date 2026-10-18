import './globals.css';
import Header from '../components/Header';

export const metadata = {
  title: 'TCG Capital',
  description: 'Compra y venta de cartas TCG',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container">TCG Capital · Envíos a España y Europa</div>
        </footer>
      </body>
    </html>
  );
}
