import LegalDoc from '../../components/LegalDoc';
import { TEXTO } from '../../lib/legal/privacidad';

export const metadata = { title: 'Política de privacidad' };

export default function Privacidad() {
  return <LegalDoc texto={TEXTO} />;
}
