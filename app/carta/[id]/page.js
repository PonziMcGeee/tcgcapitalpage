import CartaDetalle from '../../../components/CartaDetalle';
import { getListing, getSeller } from '../../../lib/seo';

export default async function Page({ params }) {
  const listing = await getListing(params.id);
  const seller = listing ? await getSeller(listing.seller_id) : null;
  return <CartaDetalle id={params.id} initialListing={listing} initialSeller={seller} />;
}
