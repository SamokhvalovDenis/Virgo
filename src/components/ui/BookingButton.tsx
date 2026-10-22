import { ArrowRight, ArrowUpRight, CalendarDays } from 'lucide-react'
import { content } from '../../data/content'
import { site } from '../../data/site'
import { trackBookingClick } from '../../lib/analytics'

type Props = { location: string; label?: string; variant?: 'gold' | 'burgundy' | 'outline'; className?: string; compact?: boolean; ariaLabel?: string; arrow?: 'right' | 'up-right' }

export function BookingButton({ location, label = content.common.book, variant = 'gold', className = '', compact = false, ariaLabel, arrow = 'up-right' }: Props) {
  const Arrow = arrow === 'right' ? ArrowRight : ArrowUpRight
  return <a className={`button button-${variant} ${compact ? 'booking-compact' : ''} ${className}`} href={site.links.booking} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} onClick={() => trackBookingClick(location)}>
    <CalendarDays size={17} aria-hidden="true" /><span className={compact ? 'sr-only' : undefined}>{label}</span>{!compact && <Arrow size={17} aria-hidden="true" />}
  </a>
}
