import CatalogoClient from '../../components/CatalogoClient';
import { getCatalogo } from '../../lib/seo';

export default async function Page({ searchParams }) {
  const cat = await getCatalogo();
  const pagina = Math.min(Math.max(parseInt(searchParams?.pagina, 10) || 1, 1), 200);
  return (
    <CatalogoClient
      initialListings={cat?.listings ?? null}
      initialSellers={cat?.sellers ?? null}
      initialPagina={pagina}
    />
  );
}
