import TiendaDetalle from '../../../components/TiendaDetalle';
import { getTienda } from '../../../lib/seo';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const initial = await getTienda(params.id);
  return <TiendaDetalle id={params.id} initial={initial} />;
}
