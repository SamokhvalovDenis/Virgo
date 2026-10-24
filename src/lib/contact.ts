import { content } from '../data/content'
import { settings } from '../data/settings'
import { giftCertificates } from '../data/giftCertificates'
import { contactSchema, contactServiceCategories, contactSubmissionSchema } from './contactSchema'
import type { ContactInput } from './contactSchema'

// A production build can never enable the mock, even with VITE_CONTACT_MODE=mock.
export const isContactMockMode = import.meta.env.DEV && import.meta.env.VITE_CONTACT_MODE === 'mock'
export const isContactAvailable = isContactMockMode || settings.contact.enabled

export type ContactResult =
  | { success: true; message: string }
  | { success: false; code: 'CONTACT_DISABLED' | 'INVALID_INPUT' | 'MOCK_ERROR' | 'CONTACT_ERROR'; message: string }

/** A successful result means the provider accepted the message, not inbox delivery. */
export async function submitContact(input: ContactInput, verification: { hcaptchaToken: string; website: string } = { hcaptchaToken: '', website: '' }): Promise<ContactResult> {
  if (!isContactAvailable) {
    return { success: false, code: 'CONTACT_DISABLED', message: content.form.disabled }
  }
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, code: 'INVALID_INPUT', message: content.form.invalid }
  }

  if (!isContactMockMode) {
    const submission = contactSubmissionSchema.safeParse({ ...parsed.data, ...verification })
    if (!submission.success) return { success: false, code: 'INVALID_INPUT', message: content.form.validation.token }
    if (submission.data.website) return { success: false, code: 'INVALID_INPUT', message: content.form.invalid }
    const { name, email, phone, serviceId, message, hcaptchaToken } = submission.data
    const service = serviceId === giftCertificates.contactFormTopic
      ? content.form.giftTopic
      : contactServiceCategories.find(category => category.id === serviceId)?.title ?? content.form.selectService
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    try {
      const response = await fetch(settings.contact.endpoint, {
        method: 'POST', credentials: 'omit', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: settings.contact.accessKey,
          subject: settings.contact.subject,
          // Custom field names appear in the email; keep React IDs internal.
          'Jméno': name,
          'E-mail': email,
          'Telefon': phone ?? '',
          'Služba': service,
          'Zpráva': message,
          // Explicit Reply-To is needed because the visible email field is Czech.
          replyto: email,
          'h-captcha-response': hcaptchaToken,
          botcheck: false,
        }), signal: controller.signal,
      })
      const result: unknown = await response.json()
      if (response.ok && typeof result === 'object' && result !== null && 'success' in result && result.success === true) {
        return { success: true, message: content.form.success }
      }
      return { success: false, code: 'CONTACT_ERROR', message: content.form.error }
    } catch {
      return { success: false, code: 'CONTACT_ERROR', message: content.form.error }
    } finally { clearTimeout(timeout) }
  }

  // No HTTP requests, persistence, or logging of contact details in mock mode.
  await new Promise<void>(resolve => setTimeout(resolve, 1000))
  if (import.meta.env.VITE_CONTACT_MOCK_RESULT === 'error') {
    return { success: false, code: 'MOCK_ERROR', message: content.form.mockError }
  }
  return { success: true, message: content.form.mockSuccess }
}
