import { ArrowUpRight, Droplet, Eye, Sparkles } from 'lucide-react'
import { categories } from '../../data/categories'
import { content } from '../../data/content'
import { services } from '../../data/services'
import { serviceDetailPages } from '../../data/serviceDetails'
import type { ServiceCategory } from '../../data/categories'
import { SectionHeading } from '../ui/SectionHeading'
import { StudioImage } from '../ui/StudioImage'
import { BookingButton } from '../ui/BookingButton'
import { Botanical } from '../ui/Botanical'

function Lotus() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 30C10 24 13 14 20 7c7 7 10 17 0 23Z" />
    <path d="M16 29C7 29 4 22 5 15c6 0 9 3 11 7m8 7c9 0 12-7 11-14-6 0-9 3-11 7" />
    <path d="M20 31C12 35 5 32 2 25c5-1 9 0 12 2m6 4c8 4 15 1 18-6-5-1-9 0-12 2" />
  </svg>
}

const icons = { massage: Lotus, depilation: Droplet, 'hair-removal': Sparkles, 'brows-lashes': Eye }

function ServiceCard({ category }: { category: ServiceCategory }) {
  const Icon = icons[category.id]
  const items = services.filter(service => service.categoryId === category.id && service.isPublished)
  const image = items.find(service => service.image)?.image
  const detailPage = serviceDetailPages.find(page => page.categoryId === category.id)
  return <article className="service-card">
    <div className={`service-art service-art-${category.id}`}>
      <StudioImage imageKey={image?.key ?? category.imageKey} alt={image?.alt ?? category.title} className="service-photo" sizes={category.id === 'massage' || category.id === 'depilation' ? '600px' : '(min-width: 1280px) 285px, (min-width: 1200px) calc((100vw - 140px) / 4), (min-width: 768px) calc((100vw - 100px) / 2), (min-width: 440px) 400px, calc(100vw - 40px)'} />
    </div>
    <div className="service-card-body">
      <span className="service-icon" aria-hidden="true"><Icon /></span>
      <h3>{category.title}</h3><p>{category.summary}</p>
      <div className="service-card-actions">
        {detailPage && <a className="service-learn-more" href={detailPage.path} aria-label={`${content.common.learnMore}: ${category.title}`}>{content.common.learnMore}<ArrowUpRight size={16} aria-hidden="true" /></a>}
        <BookingButton location={`service-${category.id}`} label={content.sections.serviceBooking} ariaLabel={`${content.sections.serviceBooking}: ${category.title}`} />
      </div>
    </div>
  </article>
}

export function Services() {
  return <section id="services" className="section-space services-section" aria-label={content.sections.servicesEyebrow}>
    <Botanical className="services-botanical services-botanical-left" />
    <Botanical className="services-botanical services-botanical-right" />
    <div className="container">
    <div className="section-header-row"><SectionHeading eyebrow={content.sections.servicesEyebrow} title={content.sections.servicesTitle} subtitle={content.sections.servicesSubtitle} /><span className="section-aside"><ArrowUpRight size={18} aria-hidden="true" />{content.sections.servicesNote}</span></div>
    <div className="services-grid">{[...categories].sort((a, b) => a.order - b.order).map(category => <ServiceCard key={category.id} category={category} />)}</div>
  </div></section>
}
