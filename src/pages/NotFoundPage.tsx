import { serviceDetailUi } from '../data/serviceDetails'

export function NotFoundPage() {
  return <div className="container section-space">
    <h1>{serviceDetailUi.notFound}</h1>
    <a className="service-detail-back" href="/#services">{serviceDetailUi.back}</a>
  </div>
}
