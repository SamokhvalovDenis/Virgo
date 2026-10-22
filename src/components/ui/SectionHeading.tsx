type Props = { eyebrow: string; title: string; subtitle?: string; centered?: boolean }
export function SectionHeading({ eyebrow, title, subtitle, centered = false }: Props) {
  return <div className={`section-heading ${centered ? 'text-center mx-auto' : ''}`}>
    <p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{subtitle && <p className="section-subtitle">{subtitle}</p>}
  </div>
}
