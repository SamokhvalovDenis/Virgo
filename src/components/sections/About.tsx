import { Check } from 'lucide-react'
import { about } from '../../data/about'
import { AboutGallery } from '../ui/AboutGallery'
import { BookingButton } from '../ui/BookingButton'
import { AboutOrnaments } from '../ui/AboutOrnaments'

export function About() {
  return <section id="about" className="section-space about-section" aria-labelledby="about-title">
    <AboutOrnaments />
    <div className="container about-container">
      <div className="about-intro">
        <p className="eyebrow about-eyebrow">{about.eyebrow}</p>
        <h2 id="about-title">{about.title}</h2>
        <div className="about-divider" aria-hidden="true">
          <svg viewBox="0 0 40 32" fill="none"><g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M20 27C11 20 14 10 20 3c6 7 9 17 0 24Z" />
            <path d="M20 27C10 28 5 19 6 10c8 1 14 7 14 17Zm0 0c10 1 15-8 14-17-8 1-14 7-14 17Z" />
            <path d="M20 27C10 31 3 26 1 19c8-2 15 1 19 8Zm0 0c10 4 17-1 19-8-8-2-15 1-19 8Z" />
          </g></svg>
        </div>
        <div className="about-copy">{about.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
        <ul className="about-values">{about.benefits.map(benefit => <li key={benefit}>
          <span className="about-value-icon"><Check size={17} strokeWidth={1.5} aria-hidden="true" /></span>
          <span>{benefit}</span>
        </li>)}</ul>
        <BookingButton location="about" label={about.ctaText} variant="burgundy" arrow="right" className="about-booking" />
      </div>
      <AboutGallery images={about.gallery} />
    </div>
  </section>
}

