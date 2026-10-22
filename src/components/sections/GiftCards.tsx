import { ArrowUpRight, Gift } from 'lucide-react'
import { content } from '../../data/content'
import { giftCertificates } from '../../data/giftCertificates'
import { Botanical } from '../ui/Botanical'
import { StudioImage } from '../ui/StudioImage'
import { SectionHeading } from '../ui/SectionHeading'
import { Benefits } from './Benefits'

export function GiftCards({ onChooseTopic }: { onChooseTopic: (topic: string) => void }) {
  if (!giftCertificates.enabled) return null
  return <section id="gifts" className="section-space gift-section">
    <svg className="gift-waves" viewBox="0 0 1440 240" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M0 70C240 250 420 20 760 125s440 65 680-40v155H0Z" fill="currentColor" fillOpacity=".12" />
      <path d="M0 70C240 250 420 20 760 125s440 65 680-40M0 85c240 180 420-50 760 55s440 65 680-40M0 100c240 180 420-50 760 55s440 65 680-40" stroke="currentColor" strokeOpacity=".18" />
    </svg>
    <div className="container gift-content">
      <Botanical className="gift-decoration" />
      <div className="gift-grid">
        <div className="gift-copy">
          <SectionHeading eyebrow={content.sections.giftsEyebrow} title={content.sections.giftsTitle} />
          <p>{giftCertificates.description}</p>
          <p className="gift-validity">{content.sections.giftsValidity.replace('{months}', String(giftCertificates.validityMonths))}</p>
          <a className="button button-gold gift-cta" href="#contact" onClick={() => onChooseTopic(giftCertificates.contactFormTopic)}>
            <Gift size={23} strokeWidth={1.6} aria-hidden="true" />
            <span>{content.sections.giftsButton}</span>
            <ArrowUpRight size={22} aria-hidden="true" />
          </a>
        </div>
        <div className="gift-visual">
          <div className="gift-card-model" aria-hidden="true">
            <Botanical className="gift-botanical" />
            <span className="gift-card-brand">{content.brand.wordmark}<small>{content.brand.descriptor}</small></span>
            <span className="gift-card-title">{content.sections.giftsCardLabel}</span>
            <span className="gift-card-note">{content.sections.giftsCardNote}</span>
          </div>
          <StudioImage imageKey={content.photos.giftCard.imageKey} alt={content.photos.giftCard.alt} className="gift-photo" />
          <span className="gift-caption">{content.sections.giftsCardCaption}</span>
        </div>
      </div>
      <Benefits />
    </div>
  </section>
}

