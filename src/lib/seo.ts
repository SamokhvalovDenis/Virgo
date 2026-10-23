import { site } from '../data/site'
import { serviceDetailPages } from '../data/serviceDetails'

export type PageMetadata = {
  title: string
  description: string
  canonical: string | null
  image: string | null
  noindex: boolean
  business: Record<string, unknown> | null
  website: Record<string, unknown> | null
}

export type HeadTag = { tag: 'meta' | 'link' | 'script'; attrs: Record<string, string>; text?: string }

const descriptions: Record<string, string> = {
  '/sluzby/masaze': 'Prohlédněte si nabídku masáží v Beauty Studio Virgo v Litoměřicích. Klasické, sportovní i relaxační masáže. Termín si rezervujte online.',
  '/sluzby/depilace': 'Depilace cukrovou pastou a voskem pro ženy i muže v Beauty Studio Virgo v Litoměřicích. Informace o procedurách a online rezervace termínu.',
  '/sluzby/trvale-odstraneni-chloupku': 'Přístrojové odstranění chloupků v Beauty Studio Virgo v Litoměřicích. Přečtěte si informace o proceduře a rezervujte si termín online.',
  '/sluzby/oboci-a-rasy': 'Lash lifting, laminace a barvení obočí a řas v Beauty Studio Virgo v Litoměřicích. Prohlédněte si nabídku péče a rezervujte si termín online.',
}

/** Use the live production host unless an explicit public build override is supplied. */
export function getSiteOrigin(value: string | undefined = import.meta.env.VITE_SITE_URL || site.seo.canonicalUrl || undefined): string | null {
  if (!value?.trim()) return null
  let url: URL
  try { url = new URL(value.trim()) }
  catch { throw new Error('VITE_SITE_URL must be a valid HTTPS origin.') }
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('VITE_SITE_URL must be an HTTPS origin without a path, query, fragment or credentials.')
  }
  return url.origin
}

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

export const indexablePaths = ['/', ...serviceDetailPages.map(page => page.path)]

function localBusiness(origin: string | null): Record<string, unknown> {
  const dayNames: Record<string, string> = {
    Pondělí: 'Monday', Úterý: 'Tuesday', Středa: 'Wednesday', Čtvrtek: 'Thursday', Pátek: 'Friday', Sobota: 'Saturday', Neděle: 'Sunday',
  }
  const openingHoursSpecification = site.openingHours.flatMap(({ day, hours }) => {
    const times = hours.match(/^(\d{2}:\d{2})[–-](\d{2}:\d{2})$/)
    return times && dayNames[day] ? [{
      '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${dayNames[day]}`, opens: times[1], closes: times[2],
    }] : []
  })
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: site.name,
    ...(origin ? { '@id': `${origin}/#business`, url: `${origin}/`, logo: new URL(site.logo.src, origin).href } : {}),
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
    ...(site.contact.email ? { email: site.contact.email } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(site.location.street ? { streetAddress: site.location.street } : {}),
      addressLocality: site.location.city,
      ...(site.location.postalCode ? { postalCode: site.location.postalCode } : {}),
      addressCountry: 'CZ',
    },
    sameAs: [site.links.facebook, site.links.instagram].filter(Boolean),
    ...(openingHoursSpecification.length ? { openingHoursSpecification } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: 'Služby',
      itemListElement: serviceDetailPages.map(page => ({
        '@type': 'Offer', itemOffered: { '@type': 'Service', name: page.title, ...(origin ? { url: `${origin}${page.path}` } : {}) },
      })),
    },
  }
}

export function getPageMetadata(pathname: string, origin = getSiteOrigin()): PageMetadata {
  const path = normalizePath(pathname)
  const detail = serviceDetailPages.find(page => page.path === path)
  const isHome = path === '/'
  const noindex = !isHome && !detail
  return {
    title: isHome ? 'Beauty Studio Virgo | Masáže a kosmetická péče Litoměřice' : detail ? `${detail.title} Litoměřice | Beauty Studio Virgo` : 'Stránka nebyla nalezena | Beauty Studio Virgo',
    description: isHome ? 'Dopřejte si chvíli relaxace v Beauty Studio Virgo v Litoměřicích. Masáže, depilace, péče o obočí a řasy. Rezervujte si termín online.' : descriptions[path] ?? 'Požadovaná stránka nebyla nalezena. Vraťte se na nabídku služeb Beauty Studio Virgo v Litoměřicích.',
    canonical: origin && !noindex ? `${origin}${path}` : null,
    image: origin && !noindex ? new URL('/images/about/gallery/virgo-5e46a6a8e504.jpg', origin).href : null,
    noindex,
    business: isHome ? localBusiness(origin) : null,
    website: isHome && origin ? {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      name: site.name,
      alternateName: 'Virgo Beauty Studio',
      url: `${origin}/`,
    } : null,
  }
}

export function getHeadTags(metadata: PageMetadata): HeadTag[] {
  const meta = (name: string, content: string): HeadTag => ({ tag: 'meta', attrs: { name, content } })
  const og = (property: string, content: string): HeadTag => ({ tag: 'meta', attrs: { property, content } })
  return [
    meta('description', metadata.description),
    ...(metadata.noindex ? [meta('robots', 'noindex, follow')] : []),
    og('og:title', metadata.title), og('og:description', metadata.description), og('og:type', 'website'),
    og('og:locale', site.locale.replace('-', '_')), og('og:site_name', site.name),
    meta('twitter:card', metadata.image ? 'summary_large_image' : 'summary'),
    meta('twitter:title', metadata.title), meta('twitter:description', metadata.description),
    ...(metadata.canonical ? [{ tag: 'link' as const, attrs: { rel: 'canonical', href: metadata.canonical } }, og('og:url', metadata.canonical)] : []),
    ...(metadata.image ? [og('og:image', metadata.image), og('og:image:alt', 'Interiér Beauty Studio Virgo v Litoměřicích'), meta('twitter:image', metadata.image), meta('twitter:image:alt', 'Interiér Beauty Studio Virgo v Litoměřicích')] : []),
    ...(metadata.business ? [{ tag: 'script' as const, attrs: { type: 'application/ld+json' }, text: JSON.stringify(metadata.business).replaceAll('<', '\\u003c') }] : []),
    ...(metadata.website ? [{ tag: 'script' as const, attrs: { type: 'application/ld+json' }, text: JSON.stringify(metadata.website).replaceAll('<', '\\u003c') }] : []),
  ]
}
