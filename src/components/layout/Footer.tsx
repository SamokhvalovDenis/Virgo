import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { content } from '../../data/content'
import { settings } from '../../data/settings'
import { site } from '../../data/site'
import { navigation } from '../../data/navigation'
import { Brand } from '../ui/Brand'
import { BookingButton } from '../ui/BookingButton'
import { ContactDetails } from '../ui/ContactDetails'

export function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-grid">
    <div>
      <Brand variant="original" />
      <p className="footer-description">{content.footer.description}</p>
      <div className="footer-socials">
        {site.links.instagram && <a href={site.links.instagram} target="_blank" rel="noopener noreferrer" aria-label={content.brand.instagram} title={content.brand.instagram}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>}
        {site.links.facebook && <a href={site.links.facebook} target="_blank" rel="noopener noreferrer" aria-label={content.brand.facebook} title={content.brand.facebook}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M13.5 22v-9h3l.5-3.5h-3.5V7.25c0-1 .3-1.75 1.75-1.75H17V2.3A23 23 0 0 0 14.3 2C11.6 2 10 3.65 10 6.7v2.8H7V13h3v9z" />
          </svg>
        </a>}
      </div>
      {site.links.website && <a className="footer-website" href={site.links.website} target="_blank" rel="noopener noreferrer">{content.footer.website}<ArrowUpRight size={16} aria-hidden="true" /></a>}
    </div>
    <div><h2>{content.footer.navigation}</h2><nav className="footer-nav" aria-label={content.footer.navigation}>{navigation.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav></div>
    <div className="footer-contacts"><h2>{content.nav.contact}</h2><ContactDetails /></div>
    <div><h2>{content.footer.booking}</h2><p>{content.footer.bookingNote}</p><BookingButton location="footer" /></div>
  </div><div className="footer-bottom"><p>© {new Date().getFullYear()} {site.name}. {content.footer.rights}</p><div>{settings.contact.privacyUrl && <a href={settings.contact.privacyUrl}>{content.footer.privacy}</a>}<span>{content.footer.signature}</span><a className="back-top" href="#" aria-label={content.common.backToTop}><ArrowUp size={18} aria-hidden="true" /></a></div></div></div></footer>
}

