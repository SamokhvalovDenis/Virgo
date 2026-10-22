import { content } from '../../data/content'
import { site } from '../../data/site'

export function Brand({ variant = 'wordmark' }: { variant?: 'wordmark' | 'original' }) {
  return <a href="/" className="brand" aria-label={`${site.name} — ${content.common.home}`}>
    {variant === 'original' ? <img className="brand-logo" src={site.logo.src} alt={site.logo.alt} width={site.logo.width} height={site.logo.height} loading="eager" decoding="async" /> : <>
      <span className="brand-symbol" aria-hidden="true">{content.brand.monogram}<span /></span>
      <span className="brand-type"><span>{content.brand.wordmark}</span><span>{content.brand.descriptor}</span></span>
    </>}
  </a>
}
