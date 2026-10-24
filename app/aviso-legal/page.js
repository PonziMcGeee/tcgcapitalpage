import LegalDoc from '../../components/LegalDoc';
import { TEXTO } from '../../lib/legal/aviso-legal';

export const metadata = { title: 'Aviso legal · AkibaTrade' };

export default function AvisoLegal() {
  return <LegalDoc texto={TEXTO} />;
}
