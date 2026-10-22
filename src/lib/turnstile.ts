type TurnstileOptions = {
  sitekey: string
  action: 'contact'
  language: 'cs'
  size: 'compact'
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}
type Turnstile = {
  render: (element: HTMLElement, options: TurnstileOptions) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global { interface Window { turnstile?: Turnstile } }

let loading: Promise<Turnstile> | undefined

/** Loaded only after the owner has explicitly enabled the real contact form. */
export function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading
  loading = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = setTimeout(() => { script.remove(); reject(new Error('Verification unavailable')) }, 10_000)
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      clearTimeout(timeout)
      if (window.turnstile) resolve(window.turnstile)
      else { script.remove(); reject(new Error('Verification unavailable')) }
    }
    script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('Verification unavailable')) }
    document.head.append(script)
  }).catch(error => { loading = undefined; throw error })
  return loading
}
