import { useState } from 'react'
import { Info } from 'lucide-react'
import { categories } from '../../data/categories'
import { content } from '../../data/content'
import { priceCatalogs } from '../../data/prices'
import type { PriceAudience } from '../../data/prices.types'
import type { ServiceCategoryId } from '../../data/categories'
import { getPriceGroups } from '../../lib/priceCatalog'
import { SectionHeading } from '../ui/SectionHeading'
import { BookingButton } from '../ui/BookingButton'
import { PriceTable } from '../ui/PriceTable'
import { PriceBotanical } from '../ui/PriceBotanical'

export function PriceList() {
  const [categoryId, setCategoryId] = useState<ServiceCategoryId>('depilation')
  const [audience, setAudience] = useState<PriceAudience>('women')
  const catalog = priceCatalogs.find(item => item.id === categoryId)
  if (!catalog) return null

  const groups = getPriceGroups(catalog, audience)
  const audienceLabel = catalog.mode === 'gender'
    ? audience === 'women' ? content.sections.pricesWomen : content.sections.pricesMen
    : undefined

  return <section id="prices" className="section-space price-section">
    <div className="price-decoration" aria-hidden="true">
      <PriceBotanical className="price-botanical-top" />
      <PriceBotanical className="price-botanical-left" />
      <PriceBotanical className="price-botanical-bottom" />
    </div>
    <div className="price-container">
      <SectionHeading
        eyebrow={content.sections.pricesEyebrow}
        title={content.sections.pricesTitle}
        subtitle={content.sections.pricesSubtitle}
      />
      <div className="price-category-switch" role="group" aria-label={content.sections.pricesCategories}>
        {priceCatalogs.map(item => <button
          key={item.id}
          id={`price-category-${item.id}`}
          type="button"
          aria-pressed={categoryId === item.id}
          aria-controls="price-panel"
          onClick={() => setCategoryId(item.id)}
        >{categories.find(category => category.id === item.id)?.title ?? item.title}</button>)}
      </div>

      <div id="price-panel" role="region" aria-labelledby={`price-category-${catalog.id}`}>
        <div className="section-header-row price-panel-heading">
          <div>
            <h3>{catalog.title}</h3>
            <p>{catalog.description}</p>
          </div>
          {catalog.mode === 'gender' && <div className="price-switch" role="group" aria-label={content.sections.pricesAudience}>
            <button type="button" aria-pressed={audience === 'women'} onClick={() => setAudience('women')}>{content.sections.pricesWomen}</button>
            <button type="button" aria-pressed={audience === 'men'} onClick={() => setAudience('men')}>{content.sections.pricesMen}</button>
          </div>}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{[catalog.title, audienceLabel].filter(Boolean).join(' — ')}</p>
        <div className="price-groups">
          {groups.map(group => <PriceTable key={group.id} group={group} categoryId={catalog.id} audienceLabel={audienceLabel} />)}
        </div>
        {catalog.notes.length > 0 && <div className="price-notes">
          <Info size={18} aria-hidden="true" />
          <div>
            {catalog.notes.map(note => <p key={note}>{note}</p>)}
          </div>
        </div>}
      </div>
      <div className="price-cta" role="group" aria-labelledby="price-cta-title">
        <svg className="price-cta-divider" viewBox="0 0 268 12" aria-hidden="true" focusable="false">
          <path d="M0 6H114 M154 6H268 M134 0.5L140 6L134 11.5L128 6Z" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <h3 id="price-cta-title">{content.sections.pricesCtaTitle}</h3>
        <p>{content.sections.pricesCtaText}</p>
        <BookingButton location={`prices-${catalog.id}`} className="price-cta-button" />
      </div>
    </div>
  </section>
}
