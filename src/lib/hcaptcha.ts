type HCaptchaOptions = {
  sitekey: string
  hl: 'cs'
  size: 'compact'
  callback: (token: string) => void
  'expired-callback': () => void
  'chalexpired-callback': () => void
  'error-callback': () => void
}
type HCaptcha = {
  render: (element: HTMLElement, options: HCaptchaOptions) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    hcaptcha?: HCaptcha
    virgoHCaptchaLoaded?: () => void
  }
}

let loading: Promise<HCaptcha> | undefined

/** Explicit rendering supports React StrictMode and retry after a blocked script. */
export function loadHCaptcha(): Promise<HCaptcha> {
  if (window.hcaptcha) return Promise.resolve(window.hcaptcha)
  if (loading) return loading
  loading = new Promise<HCaptcha>((resolve, reject) => {
    const script = document.createElement('script')
    const cleanup = () => { clearTimeout(timeout); delete window.virgoHCaptchaLoaded }
    const fail = () => { cleanup(); script.remove(); reject(new Error('Verification unavailable')) }
    const timeout = setTimeout(fail, 15_000)
    window.virgoHCaptchaLoaded = () => {
      if (!window.hcaptcha) { fail(); return }
      cleanup()
      resolve(window.hcaptcha)
    }
    script.src = 'https://js.hcaptcha.com/1/api.js?onload=virgoHCaptchaLoaded&render=explicit&recaptchacompat=off&hl=cs'
    script.async = true
    script.defer = true
    script.onerror = fail
    document.head.append(script)
  }).catch(error => { loading = undefined; throw error })
  return loading
}
