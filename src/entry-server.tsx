import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './app/App'

export { getHeadTags, getPageMetadata, getSiteOrigin, indexablePaths } from './lib/seo'

export function render(pathname: string): string {
  return renderToString(<StrictMode><App pathname={pathname} /></StrictMode>)
}
