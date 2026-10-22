import { contactSubmissionSchema, contactServiceCategories } from '../../src/lib/contactSchema'
import { giftCertificates } from '../../src/data/giftCertificates'

/** Runtime configuration belongs in Cloudflare Pages, never in VITE_* variables. */
export type ContactEnv = {
  CONTACT_ENABLED?: string
  CONTACT_ALLOWED_ORIGIN?: string
  CONTACT_PRIVACY_URL?: string
  CONTACT_FROM?: string
  CONTACT_TO?: string
  RESEND_API_KEY?: string
  TURNSTILE_SECRET_KEY?: string
}

const maxBodyBytes = 16_384
const responseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
}

function respond(status: number, code?: string): Response {
  return new Response(JSON.stringify(code ? { success: false, code } : { success: true }), {
    status, headers: { ...responseHeaders, ...(status === 405 ? { Allow: 'POST' } : {}) },
  })
}

function getConfiguration(env: ContactEnv) {
  if (env.CONTACT_ENABLED !== 'true' || !env.RESEND_API_KEY?.trim() || !env.TURNSTILE_SECRET_KEY?.trim()) return null
  try {
    const origin = new URL(env.CONTACT_ALLOWED_ORIGIN ?? '')
    const privacy = new URL(env.CONTACT_PRIVACY_URL ?? '', origin)
    const email = contactSubmissionSchema.shape.email
    if (origin.protocol !== 'https:' || origin.origin !== env.CONTACT_ALLOWED_ORIGIN || origin.username || origin.password) return null
    if (!env.CONTACT_PRIVACY_URL?.trim() || privacy.protocol !== 'https:' || privacy.username || privacy.password) return null
    if (!email.safeParse(env.CONTACT_FROM).success || !email.safeParse(env.CONTACT_TO).success) return null
    return { origin: origin.origin, hostname: origin.hostname, from: env.CONTACT_FROM!, to: env.CONTACT_TO! }
  } catch { return null }
}

class BodyError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code) }
}

async function readBody(request: Request): Promise<unknown> {
  const length = request.headers.get('Content-Length')
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBodyBytes)) throw new BodyError(413, 'PAYLOAD_TOO_LARGE')
  if (!request.body) throw new BodyError(400, 'INVALID_INPUT')
  const reader = request.body.getReader()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const text = await Promise.race([
      (async () => {
        const chunks: Uint8Array[] = []
        let bytes = 0
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          bytes += value.byteLength
          if (bytes > maxBodyBytes) throw new BodyError(413, 'PAYLOAD_TOO_LARGE')
          chunks.push(value)
        }
        const body = new Uint8Array(bytes)
        let offset = 0
        for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
        return new TextDecoder('utf-8', { fatal: true }).decode(body)
      })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new BodyError(408, 'REQUEST_TIMEOUT')), 5_000) }),
    ])
    return JSON.parse(text)
  } catch (error) {
    if (error instanceof BodyError) throw error
    throw new BodyError(400, 'INVALID_INPUT')
  } finally {
    clearTimeout(timer)
    void reader.cancel().catch(() => {})
  }
}

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}): Promise<{ response: Response; data: unknown }> {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body), signal: AbortSignal.timeout(5_000),
  })
  const data: unknown = await response.json()
  return { response, data }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** No contact input, token, address or provider error is logged or stored here. */
export async function onRequest({ request, env = {} }: { request: Request; env?: ContactEnv }): Promise<Response> {
  if (request.method !== 'POST') return respond(405, 'METHOD_NOT_ALLOWED')
  const config = getConfiguration(env)
  // Fail before reading personal data when the owner has not activated the integration.
  if (!config) return respond(503, 'CONTACT_NOT_CONFIGURED')
  if (new URL(request.url).origin !== config.origin || request.headers.get('Origin') !== config.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    return respond(403, 'ORIGIN_NOT_ALLOWED')
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return respond(415, 'UNSUPPORTED_MEDIA_TYPE')

  let raw: unknown
  try { raw = await readBody(request) }
  catch (error) { return error instanceof BodyError ? respond(error.status, error.code) : respond(400, 'INVALID_INPUT') }
  const parsed = contactSubmissionSchema.safeParse(raw)
  if (!parsed.success) return respond(400, 'INVALID_INPUT')
  const { turnstileToken, website, submissionId, ...input } = parsed.data
  if (website) return respond(400, 'INVALID_INPUT')

  try {
    const validation = await postJson('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      secret: env.TURNSTILE_SECRET_KEY, response: turnstileToken,
    })
    if (!validation.response.ok) return respond(502, 'VERIFICATION_UNAVAILABLE')
    if (!isRecord(validation.data) || validation.data.success !== true || validation.data.hostname !== config.hostname || validation.data.action !== 'contact') {
      return respond(400, 'VERIFICATION_FAILED')
    }
    const topic = input.serviceId === giftCertificates.contactFormTopic ? 'Dárkový poukaz'
      : contactServiceCategories.find(category => category.id === input.serviceId)?.title ?? 'Obecný dotaz'
    const delivery = await postJson('https://api.resend.com/emails', {
      from: config.from, to: [config.to], reply_to: input.email,
      subject: 'Nový dotaz z webu Beauty Studio Virgo',
      // Plain text avoids interpolating untrusted contact input into HTML or headers.
      text: [`Jméno: ${input.name}`, `E-mail: ${input.email}`, `Telefon: ${input.phone || 'Neuveden'}`, `Téma: ${topic}`, '', input.message].join('\n'),
    }, { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Idempotency-Key': `contact/${submissionId}` })
    if (!delivery.response.ok || !isRecord(delivery.data) || typeof delivery.data.id !== 'string' || !delivery.data.id) {
      return respond(502, 'DELIVERY_FAILED')
    }
    return respond(200)
  } catch { return respond(502, 'CONTACT_UNAVAILABLE') }
}

