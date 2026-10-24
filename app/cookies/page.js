import LegalDoc from '../../components/LegalDoc';
import { TEXTO } from '../../lib/legal/cookies';

export const metadata = { title: 'Política de cookies · AkibaTrade' };

export default function Pagina() {
  return <LegalDoc texto={TEXTO} />;
}
