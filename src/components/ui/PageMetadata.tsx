import { useEffect } from 'react'
import { getHeadTags, getPageMetadata } from '../../lib/seo'

/** Build output already contains these tags; this also covers the Vite dev server. */
export function PageMetadata({ pathname }: { pathname: string }) {
  useEffect(() => {
    // Every production URL is prerendered and navigation loads a fresh document.
    // Keep this development helper out of the production client dependency graph.
    if (import.meta.env.PROD) return
    const metadata = getPageMetadata(pathname)
    document.title = metadata.title
    document.querySelectorAll('[data-virgo-seo]').forEach(tag => tag.remove())
    for (const tag of getHeadTags(metadata)) {
      const element = document.createElement(tag.tag)
      element.setAttribute('data-virgo-seo', '')
      for (const [name, value] of Object.entries(tag.attrs)) element.setAttribute(name, value)
      if (tag.text) element.textContent = tag.text
      document.head.append(element)
    }
  }, [pathname])
  return null
}
