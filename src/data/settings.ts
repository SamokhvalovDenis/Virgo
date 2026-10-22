function getPrivacyUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const url = value.trim()
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : null
  } catch { return null }
}

// These values are public build configuration. Server secrets must never use VITE_.
const privacyUrl = getPrivacyUrl(import.meta.env.VITE_CONTACT_PRIVACY_URL)
const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim()
export const settings = {
  contact: {
    enabled: import.meta.env.PROD && import.meta.env.VITE_CONTACT_MODE === 'production' && Boolean(privacyUrl && turnstileSiteKey),
    endpoint: '/api/contact',
    privacyUrl,
    turnstileSiteKey,
  },
  analytics: { enabled: false },
} as const
