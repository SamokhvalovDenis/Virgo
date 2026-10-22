import { ArrowLeft } from 'lucide-react'
import { serviceDetailUi } from '../data/serviceDetails'
import type { ServiceDetailPage as DetailPage } from '../data/serviceDetails'
import { ServiceDetailBlocks } from '../components/sections/ServiceDetailBlocks'

export function ServiceDetailPage({ page }: { page: DetailPage }) {
  return <div className="service-detail-page">
    <div className="container">
      <header className="service-detail-heading">
        <a className="service-detail-back" href="/#services"><ArrowLeft size={18} aria-hidden="true" />{serviceDetailUi.back}</a>
        <p className="eyebrow">{serviceDetailUi.eyebrow}</p>
        <h1>{page.title}</h1>
      </header>
      <ServiceDetailBlocks blocks={page.blocks} />
      <a className="service-detail-back service-detail-end" href="/#services"><ArrowLeft size={18} aria-hidden="true" />{serviceDetailUi.back}</a>
    </div>
  </div>
}
