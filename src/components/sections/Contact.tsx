import { Component, lazy, Suspense, type ReactNode } from 'react'
import { content } from '../../data/content'
import { BookingButton } from '../ui/BookingButton'
import { SectionHeading } from '../ui/SectionHeading'
import type { ContactFormProps } from './ContactForm'
import { ContactDetails } from '../ui/ContactDetails'

// Prerender the entire form, then hydrate its validation code in a separate chunk.
// The server resolves this import before renderToString; no form HTML is omitted.
const ContactForm = import.meta.env.SSR
  ? (await import('./ContactForm')).ContactForm
  : lazy(() => import('./ContactForm').then(module => ({ default: module.ContactForm })))

class ContactFormBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <div className="contact-form"><h3>{content.sections.contactFormTitle}</h3><p role="alert">{content.form.disabled}</p></div>
      : this.props.children
  }
}

export function Contact({ topic, onTopicChange }: ContactFormProps) {
  return <section id="contact" className="section-space contact-section">
    <ContactBotanical className="contact-botanical-top" />
    <ContactBotanical className="contact-botanical-bottom" />
    <div className="container contact-grid">
      <div className="contact-copy">
        <SectionHeading eyebrow={content.sections.contactEyebrow} title={content.sections.contactTitle} subtitle={content.sections.contactDescription} />
        <ContactDetails variant="cards" showHours />
        <div className="contact-booking">
          <BookingButton location="contact" className="contact-booking-button" />
          <p>{content.sections.contactBookingNote}</p>
        </div>
      </div>
      <ContactFormBoundary><Suspense fallback={<div className="contact-form" role="status">Načítání formuláře…</div>}><ContactForm topic={topic} onTopicChange={onTopicChange} /></Suspense></ContactFormBoundary>
    </div>
  </section>
}

function ContactBotanical({ className }: { className: string }) {
  return <svg className={`contact-botanical ${className}`} width="200" height="330" viewBox="0 0 200 330" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" focusable="false">
    <path d="M170 320C151 239 81 190 66 115C57 72 48 32 22 5" />
    <path d="M63 102C20 92 10 62 9 40C42 49 60 70 63 102ZM78 149C110 116 115 85 109 62C83 84 73 116 78 149ZM104 200C65 193 36 170 29 143C66 150 93 170 104 200ZM128 238C153 205 158 170 150 145C125 173 120 209 128 238ZM155 281C112 275 85 251 77 226C112 231 142 252 155 281Z" />
    <path d="M12 43L63 102M109 66L78 149M32 146L104 200M150 149L128 238M80 229L155 281M22 57L59 91M99 87L80 137M44 159L94 188M143 171L128 224M94 242L143 269" strokeWidth=".7" />
  </svg>
}

