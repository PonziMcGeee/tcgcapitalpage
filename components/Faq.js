import { FAQ } from '../lib/faq';

const VISIBLES = 5; // el resto queda bajo «Ver más preguntas»

// Preguntas frecuentes desplegables + datos estructurados para Google
export default function Faq() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return (
    <section className="home-section" id="preguntas-frecuentes">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h2>Preguntas frecuentes</h2>
      <div className="faq">
        {FAQ.slice(0, VISIBLES).map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <p className="muted">{f.a}</p>
          </details>
        ))}
        {FAQ.length > VISIBLES && (
          <details className="faq-more">
            <summary>Ver más preguntas ({FAQ.length - VISIBLES})</summary>
            <div className="faq">
              {FAQ.slice(VISIBLES).map((f) => (
                <details key={f.q} className="faq-item">
                  <summary>{f.q}</summary>
                  <p className="muted">{f.a}</p>
                </details>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
