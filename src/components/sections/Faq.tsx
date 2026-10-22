import { ChevronDown } from 'lucide-react'
import { content } from '../../data/content'
import { faq } from '../../data/faq'
import { SectionHeading } from '../ui/SectionHeading'

export function Faq() {
  if (!faq.length) return null
  return <section id="faq" className="section-space"><div className="container faq-container"><SectionHeading eyebrow={content.sections.faqEyebrow} title={content.sections.faqTitle} centered />{faq.map(item => <details key={item.id} className="faq-item"><summary>{item.question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>
}

