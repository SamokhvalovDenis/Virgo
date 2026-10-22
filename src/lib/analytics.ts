import { settings } from '../data/settings'

/** Opt-in event bridge. No third-party script, storage or personal data by default. */
export function trackBookingClick(location: string) {
  if (settings.analytics.enabled) {
    window.dispatchEvent(new CustomEvent('virgo:booking-click', { detail: { location } }))
  }
}
