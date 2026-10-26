import LegalDoc from '../../components/LegalDoc';
import { TEXTO } from '../../lib/legal/cookies';

export const metadata = { title: 'Política de cookies' };

export default function Pagina() {
  return <LegalDoc texto={TEXTO} />;
}
