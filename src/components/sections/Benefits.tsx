import { Sprout, Ticket } from 'lucide-react'
import { benefits } from '../../data/benefits'
import { content } from '../../data/content'

export function Benefits() {
  if (!benefits.enabled) return null
  return <>
    <div className="gift-divider" aria-hidden="true"><Sprout size={25} strokeWidth={1.1} /></div>
    <div id="benefits" className="benefits-inner" role="region" aria-labelledby="benefits-title">
      <div className="benefits-intro">
        <div className="benefits-icon"><Ticket size={29} strokeWidth={1.4} aria-hidden="true" /></div>
        <div className="benefits-copy">
          <h3 id="benefits-title">Přijímáme {content.sections.benefitsTitle}</h3>
          <p>Možnost platby vybranými zaměstnaneckými benefity.</p>
        </div>
      </div>
      <ul className="benefit-products">{benefits.products.map(product => <li key={product}>{product}</li>)}</ul>
    </div>
  </>
}

