import { getListing, jsonLdCarta, metadataCarta } from '../../../lib/seo';

export async function generateMetadata({ params }) {
  return metadataCarta(await getListing(params.id), params.id);
}

export default async function CartaLayout({ children, params }) {
  const ld = jsonLdCarta(await getListing(params.id), params.id);
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
      {children}
    </>
  );
}
