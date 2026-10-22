import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { BookingButton } from '../components/ui/BookingButton'
import { content } from '../data/content'
import { serviceDetailPages } from '../data/serviceDetails'
import { HomePage } from '../pages/HomePage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PageMetadata } from '../components/ui/PageMetadata'
import { normalizePath } from '../lib/seo'

type AppProps = { pathname?: string }

export default function App({ pathname = typeof window === 'undefined' ? '/' : window.location.pathname }: AppProps) {
  const path = normalizePath(pathname)
  const detailPage = serviceDetailPages.find(page => page.path === path)
  const isHome = path === '/'
  const page = isHome ? <HomePage /> : detailPage ? <ServiceDetailPage page={detailPage} /> : <NotFoundPage />

  return <>
    <PageMetadata pathname={path} />
    <a className="skip-link" href="#main">{content.common.skipToContent}</a>
    <Header />
    <main id="main" tabIndex={-1}>{page}</main>
    <Footer />
    {isHome && <div className="mobile-booking"><BookingButton location="mobile" /></div>}
  </>
}
