import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, CheckCircle2, Info, LoaderCircle } from 'lucide-react'
import { content } from '../../data/content'
import { giftCertificates } from '../../data/giftCertificates'
import { settings } from '../../data/settings'
import { contactSchema, contactServiceCategories } from '../../lib/contactSchema'
import type { ContactInput } from '../../lib/contactSchema'
import { isContactAvailable, isContactMockMode, submitContact } from '../../lib/contact'
import { loadTurnstile } from '../../lib/turnstile'

type Errors = Partial<Record<keyof ContactInput, string>>
export type ContactFormProps = { topic: string; onTopicChange: (value: string) => void }

function validate(form: HTMLFormElement) {
  return contactSchema.safeParse(Object.fromEntries(new FormData(form)))
}

export function ContactForm({ topic, onTopicChange }: ContactFormProps) {
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')
  const sending = useRef(false)
  const pendingSubmission = useRef<{ input: string; id: string } | null>(null)
  const verificationContainer = useRef<HTMLDivElement>(null)
  const verificationWidget = useRef<string | undefined>(undefined)
  const [verificationToken, setVerificationToken] = useState('')
  const [verificationFailed, setVerificationFailed] = useState(false)
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const needsVerification = isContactAvailable && !isContactMockMode

  useEffect(() => {
    if (!needsVerification || !verificationContainer.current) return
    let active = true
    let widgetId: string | undefined
    const container = verificationContainer.current
    loadTurnstile().then(api => {
      if (!active) return
      widgetId = api.render(container, {
        sitekey: settings.contact.turnstileSiteKey, action: 'contact', language: 'cs', size: 'compact',
        callback: token => { if (active) { setVerificationToken(token); setVerificationFailed(false) } },
        'expired-callback': () => { if (active) setVerificationToken('') },
        'error-callback': () => { if (active) { setVerificationToken(''); setVerificationFailed(true) } },
      })
      verificationWidget.current = widgetId
    }).catch(() => { if (active) setVerificationFailed(true) })
    return () => {
      active = false
      if (widgetId) window.turnstile?.remove(widgetId)
      verificationWidget.current = undefined
    }
  }, [needsVerification, verificationAttempt])

  function onChange(event: FormEvent<HTMLFormElement>) {
    if (sending.current) return
    if (status !== 'idle') { setStatus('idle'); setFeedback('') }
    if (pendingSubmission.current) {
      const current = validate(event.currentTarget)
      if (!current.success || JSON.stringify(current.data) !== pendingSubmission.current.input) pendingSubmission.current = null
    }
    if (Object.keys(errors).length === 0) return
    const parsed = validate(event.currentTarget)
    const nextErrors: Errors = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactInput
        if (errors[key]) nextErrors[key] ??= issue.message
      }
    }
    setErrors(nextErrors)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isContactAvailable || sending.current) return
    const form = event.currentTarget
    const parsed = validate(form)
    setFeedback('')
    if (!parsed.success) {
      const nextErrors: Errors = {}
      parsed.error.issues.forEach(issue => { const key = issue.path[0] as keyof ContactInput; nextErrors[key] ??= issue.message })
      setErrors(nextErrors)
      setStatus('idle')
      const field = form.elements.namedItem(Object.keys(nextErrors)[0])
      if (field instanceof HTMLElement) field.focus()
      return
    }
    sending.current = true
    if (needsVerification && !verificationToken) {
      sending.current = false
      setStatus('error'); setFeedback(content.form.validation.token)
      return
    }
    setErrors({}); setStatus('sending')
    try {
      if (needsVerification) {
        const normalizedInput = JSON.stringify(parsed.data)
        if (pendingSubmission.current?.input !== normalizedInput) {
          pendingSubmission.current = { input: normalizedInput, id: crypto.randomUUID() }
        }
      }
      const website = new FormData(form).get('website')
      const result = await submitContact(parsed.data, { turnstileToken: verificationToken, website: typeof website === 'string' ? website : '', submissionId: pendingSubmission.current?.id ?? '' })
      setFeedback(result.message)
      setStatus(result.success ? 'success' : 'error')
      if (result.success) { pendingSubmission.current = null; form.reset(); onTopicChange('') }
    } catch {
      setFeedback(content.form.error)
      setStatus('error')
    } finally {
      sending.current = false
      if (needsVerification) {
        setVerificationToken('')
        if (verificationWidget.current) window.turnstile?.reset(verificationWidget.current)
      }
    }
  }
  const textField = (name: 'name' | 'email' | 'phone', label: string, placeholder: string, type = 'text', required = false) => <div className="form-field"><label htmlFor={`contact-${name}`}>{label}{required && <span aria-hidden="true"> *</span>}</label><input id={`contact-${name}`} name={name} type={type} placeholder={placeholder} required={required} autoComplete={name === 'name' ? 'name' : name === 'email' ? 'email' : 'tel'} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : undefined} />{errors[name] && <p className="field-error" id={`error-${name}`}>{errors[name]}</p>}</div>
  return <form className="contact-form" onSubmit={onSubmit} onChange={onChange} noValidate aria-label={content.sections.contactFormTitle} aria-busy={status === 'sending'} aria-describedby={isContactMockMode ? 'form-mock-notice' : !isContactAvailable ? 'form-availability' : undefined}>
    <h3>{content.sections.contactFormTitle}</h3><p className="form-required-note">{content.form.requiredNote}</p>
    {isContactMockMode && <div className="form-notice" id="form-mock-notice"><Info size={18} aria-hidden="true" /><p>{content.form.mockNotice}</p></div>}
    {!isContactAvailable && <div className="form-notice" id="form-availability"><Info size={18} aria-hidden="true" /><p>{content.form.disabled}</p></div>}
    <fieldset className="form-fields" disabled={status === 'sending'}>
    {needsVerification && <div className="form-honeypot" aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" name="website" type="text" autoComplete="off" tabIndex={-1} maxLength={200} /></div>}
    <div className="contact-fields-grid">
      {textField('name', content.form.name, content.form.namePlaceholder, 'text', true)}
      {textField('email', content.form.email, content.form.emailPlaceholder, 'email', true)}
      {textField('phone', content.form.phone, content.form.phonePlaceholder, 'tel')}
      <div className="form-field"><label htmlFor="contact-service">{content.form.service}</label><select id="contact-service" name="serviceId" value={topic} onChange={event => onTopicChange(event.target.value)} aria-invalid={Boolean(errors.serviceId)} aria-describedby={errors.serviceId ? 'error-serviceId' : undefined}><option value="">{content.form.selectService}</option>{giftCertificates.enabled && <option value={giftCertificates.contactFormTopic}>{content.form.giftTopic}</option>}{contactServiceCategories.map(category => <option key={category.id} value={category.id}>{category.title}</option>)}</select>{errors.serviceId && <p className="field-error" id="error-serviceId">{errors.serviceId}</p>}</div>
      <div className="form-field form-field-message"><label htmlFor="contact-message">{content.form.message}<span aria-hidden="true"> *</span></label><textarea id="contact-message" name="message" placeholder={content.form.messagePlaceholder} required rows={4} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'error-message' : undefined} />{errors.message && <p className="field-error" id="error-message">{errors.message}</p>}</div>
    </div>
    </fieldset>
    {needsVerification && <div className="form-verification"><div ref={verificationContainer} /><p className="form-required-note" aria-live="polite">{verificationFailed ? content.form.verificationError : !verificationToken ? content.form.validation.token : ''}</p>{verificationFailed && <button className="form-verification-retry" type="button" onClick={() => { setVerificationFailed(false); setVerificationToken(''); setVerificationAttempt(value => value + 1) }}>{content.form.verificationRetry}</button>}</div>}
    <p className="form-privacy">{isContactAvailable && !isContactMockMode ? content.form.privacyNotice : content.form.privacyPending}{settings.contact.privacyUrl && <> <a href={settings.contact.privacyUrl}>{content.form.privacyLink}</a></>}</p>
    <button className="button button-burgundy form-submit" type="submit" disabled={!isContactAvailable || status === 'sending' || (needsVerification && !verificationToken)}>{!isContactAvailable ? content.form.disabledButton : status === 'sending' ? content.form.submitting : content.common.send}{status === 'sending' ? <LoaderCircle className="form-spinner" size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}</button>
    <div role="status" aria-live="polite" aria-atomic="true">{feedback && <p className={`form-status ${status === 'error' ? 'field-error' : 'form-success'}`}>{status === 'success' && <CheckCircle2 size={18} aria-hidden="true" />}{feedback}</p>}</div>
  </form>
}

