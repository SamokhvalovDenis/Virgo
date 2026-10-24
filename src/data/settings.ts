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
// Web3Forms access keys are public. A default keeps clean Cloudflare builds working
// without relying on ignored .env.local files or Worker runtime variables.
const accessKey = (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? '2230598f-5e86-432e-8e9d-4a6651ab4b83').trim()
export const settings = {
  contact: {
    enabled: import.meta.env.VITE_CONTACT_MODE !== 'disabled' && Boolean(accessKey),
    endpoint: 'https://api.web3forms.com/submit',
    accessKey,
    subject: 'Nová zpráva z webu Beauty Studio Virgo',
    // Shared site key documented by Web3Forms for its free hCaptcha integration.
    hcaptchaSiteKey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2',
    privacyUrl,
  },
  analytics: { enabled: false },
} as const
