import { ArrowUpRight, Clock3, Mail, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { content } from '../../data/content'
import { getGoogleMapsUrl, getLocationLabel, site } from '../../data/site'

function ContactInfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="contact-info-card">
    <span className="contact-icon">{icon}</span>
    <div><h3>{title}</h3>{children}</div>
  </div>
}

export function OpeningHoursCard() {
  if (!site.openingHours.length && !site.hoursNote) return null
  return <div className="contact-hours-card">
    <div className="contact-hours-heading"><span className="contact-icon"><Clock3 size={27} strokeWidth={1.6} aria-hidden="true" /></span><h3>{content.sections.contactHours}</h3></div>
    {site.openingHours.length > 0 && <dl className="contact-hours-grid">
      {site.openingHours.map(({ day, hours }) => <div key={day}><dt>{day}</dt><dd>{hours}</dd></div>)}
    </dl>}
    {site.hoursNote && <p className="contact-hours-note">{site.hoursNote}</p>}
  </div>
}

export function ContactDetails({ showHours = false, variant = 'list' }: { showHours?: boolean; variant?: 'list' | 'cards' }) {
  const mapUrl = getGoogleMapsUrl()
  if (variant === 'cards') return <>
    <div className="contact-info-grid">
      <ContactInfoCard title={content.sections.contactAddress} icon={<MapPin size={25} strokeWidth={1.7} aria-hidden="true" />}>
        <address>{getLocationLabel()}</address>
        {mapUrl && <a className="contact-card-map" href={mapUrl} target="_blank" rel="noopener noreferrer">{content.common.map}<ArrowUpRight size={16} aria-hidden="true" /></a>}
      </ContactInfoCard>
      {site.contact.phone && <ContactInfoCard title={content.sections.contactPhone} icon={<Phone size={24} strokeWidth={1.7} aria-hidden="true" />}>
        <a href={site.contact.phoneHref || `tel:${site.contact.phone.replace(/\s/g, '')}`}>{site.contact.phone}</a>
      </ContactInfoCard>}
      {site.contact.email && <ContactInfoCard title={content.form.email} icon={<Mail size={25} strokeWidth={1.7} aria-hidden="true" />}>
        <a href={site.contact.emailHref || `mailto:${site.contact.email}`}>{site.contact.email}</a>
      </ContactInfoCard>}
    </div>
    {showHours && <OpeningHoursCard />}
  </>
  return <div className="contact-details">
    <div className="contact-item">
      <MapPin size={22} strokeWidth={1.5} aria-hidden="true" />
      <div>
        <h3>{content.sections.contactLocation}</h3>
        <address>{getLocationLabel()}</address>
        {mapUrl && <a className="contact-map-link" href={mapUrl} target="_blank" rel="noopener noreferrer">
          {content.common.map}<ArrowUpRight size={14} aria-hidden="true" />
        </a>}
      </div>
    </div>
    {site.contact.phone && <div className="contact-item">
      <Phone size={21} aria-hidden="true" />
      <a href={site.contact.phoneHref || `tel:${site.contact.phone.replace(/\s/g, '')}`}>{site.contact.phone}</a>
    </div>}
    {site.contact.email && <div className="contact-item">
      <Mail size={21} aria-hidden="true" />
      <a href={site.contact.emailHref || `mailto:${site.contact.email}`}>{site.contact.email}</a>
    </div>}
    {showHours && (site.openingHours.length > 0 || site.hoursNote) && <div className="contact-item">
      <Clock3 size={21} aria-hidden="true" />
      <div className="contact-hours">
        <h3>{content.sections.contactHours}</h3>
        {site.openingHours.length > 0 && <dl className="opening-hours">
          {site.openingHours.map(({ day, hours }) => <div key={day}><dt>{day}</dt><dd>{hours}</dd></div>)}
        </dl>}
        {site.hoursNote && <p className="opening-hours-note">{site.hoursNote}</p>}
      </div>
    </div>}
  </div>
}
