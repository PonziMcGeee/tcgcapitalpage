import LegalDoc from '../../components/LegalDoc';
import { TEXTO } from '../../lib/legal/condiciones';

export const metadata = { title: 'Condiciones de uso · AkibaTrade' };

export default function Pagina() {
  return <LegalDoc texto={TEXTO} />;
}
