import { content } from './content'
import { reviews } from './reviews'
import { giftCertificates } from './giftCertificates'

export const navigation = [
  { href: '/#services', label: content.nav.services },
  { href: '/#prices', label: content.nav.prices },
  { href: '/#about', label: content.nav.about },
  ...(reviews.length ? [{ href: '/#reviews', label: content.nav.reviews }] : []),
  ...(giftCertificates.enabled ? [{ href: '/#gifts', label: content.nav.gifts }] : []),
  { href: '/#contact', label: content.nav.contact },
]
