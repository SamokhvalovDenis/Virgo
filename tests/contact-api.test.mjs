import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

let server, onRequest
const valid = { name: 'Test klient', email: 'client@example.com', phone: '', serviceId: '', message: '<script>Test</script>\nDruhý řádek.', turnstileToken: 'test-token', website: '', submissionId: '9f3b01de-26c2-4d41-8b89-88a600b07c86' }
const env = {
  CONTACT_ENABLED: 'true', CONTACT_ALLOWED_ORIGIN: 'https://contact.test', CONTACT_PRIVACY_URL: '/test-privacy',
  CONTACT_FROM: 'sender@example.com', CONTACT_TO: 'studio@example.com', RESEND_API_KEY: 'fake-test-key', TURNSTILE_SECRET_KEY: 'fake-test-secret',
}
const verification = { success: true, hostname: 'contact.test', action: 'contact' }
function request(body = valid, headers = {}) {
  return new Request('https://contact.test/api/contact', {
    method: 'POST', headers: { Origin: env.CONTACT_ALLOWED_ORIGIN, 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

async function mocked(responses, run) {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    assert.ok(['https://challenges.cloudflare.com/turnstile/v0/siteverify', 'https://api.resend.com/emails'].includes(url))
    calls.push({ url, ...init, body: JSON.parse(init.body) })
    assert.ok(responses.length, 'Unexpected provider call')
    const response = responses.shift()
    if (response instanceof Error) throw response
    return response instanceof Response ? response : Response.json(response)
  }
  try { return await run(calls) }
  finally { globalThis.fetch = original }
}

before(async () => {
  server = await createServer({ envFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null } })
  ;({ onRequest } = await server.ssrLoadModule('/functions/api/contact.ts'))
})
after(async () => { await server?.close() })

test('contact endpoint fails closed without every required runtime setting and never calls providers', async () => {
  await mocked([], async calls => {
    for (const key of Object.keys(env)) {
      const configuration = { ...env, [key]: '' }
      const response = await onRequest({ request: request(), env: configuration })
      assert.equal(response.status, 503, key)
      assert.deepEqual(await response.json(), { success: false, code: 'CONTACT_NOT_CONFIGURED' })
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
      assert.equal(response.headers.get('access-control-allow-origin'), null)
    }
    for (const configuration of [{ ...env, CONTACT_ALLOWED_ORIGIN: 'http://contact.test' }, { ...env, CONTACT_ALLOWED_ORIGIN: 'https://contact.test/path' }, { ...env, CONTACT_FROM: 'sender@example.com\r\nBcc: x@example.com' }, { ...env, CONTACT_PRIVACY_URL: 'javascript:alert(1)' }]) {
      assert.equal((await onRequest({ request: request(), env: configuration })).status, 503)
    }
    assert.equal((await onRequest({ request: request() })).status, 503)
    assert.deepEqual(calls, [])
  })
})

test('methods, origin, JSON type, schema, honeypot and byte limits reject before provider requests', async () => {
  await mocked([], async calls => {
    const method = await onRequest({ request: new Request('https://contact.test/api/contact'), env })
    assert.equal(method.status, 405)
    assert.equal(method.headers.get('allow'), 'POST')
    for (const [body, headers, status] of [
      [valid, { Origin: 'https://attacker.test' }, 403],
      [valid, { Origin: '' }, 403],
      [valid, { 'Sec-Fetch-Site': 'cross-site' }, 403],
      [valid, { 'Content-Type': 'text/plain' }, 415],
      ['{invalid', {}, 400], [null, {}, 400],
      [{ ...valid, email: 'invalid' }, {}, 400],
      [{ ...valid, message: 'x'.repeat(2001) }, {}, 400],
      [{ ...valid, serviceId: 'unknown' }, {}, 400],
      [{ ...valid, turnstileToken: '' }, {}, 400],
      [{ ...valid, turnstileToken: 'x'.repeat(2049) }, {}, 400],
      [{ ...valid, submissionId: '' }, {}, 400],
      [{ ...valid, submissionId: 'bad\r\nheader' }, {}, 400],
      [{ ...valid, website: 'spam.example' }, {}, 400],
      ['x'.repeat(16_385), {}, 413],
      ['💜'.repeat(5000), {}, 413],
      [valid, { 'Content-Length': '20000' }, 413],
    ]) assert.equal((await onRequest({ request: request(body, headers), env })).status, status)
    assert.deepEqual(calls, [])
  })
})

test('Turnstile must accept a single-use token for the exact hostname and contact action', async () => {
  for (const result of [{ success: false }, { ...verification, hostname: 'attacker.test' }, { ...verification, action: 'login' }, { hostname: 'contact.test', action: 'contact' }]) {
    await mocked([result], async calls => {
      const response = await onRequest({ request: request(), env })
      assert.equal(response.status, 400)
      assert.deepEqual(await response.json(), { success: false, code: 'VERIFICATION_FAILED' })
      assert.equal(calls.length, 1)
    })
  }
})

test('only provider acceptance returns success; email is plain text with fixed sender, recipient and subject', async () => {
  await mocked([verification, { id: 'mock-email-id' }], async calls => {
    const response = await onRequest({ request: request(), env })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { success: true })
    assert.equal(calls.length, 2)
    assert.deepEqual(calls[0].body, { secret: env.TURNSTILE_SECRET_KEY, response: valid.turnstileToken })
    const email = calls[1].body
    assert.equal(email.from, env.CONTACT_FROM)
    assert.deepEqual(email.to, [env.CONTACT_TO])
    assert.equal(email.reply_to, valid.email)
    assert.equal(email.html, undefined)
    assert.ok(email.text.endsWith(valid.message))
    assert.ok(!email.subject.includes(valid.name))
    assert.equal(calls[1].headers.Authorization, `Bearer ${env.RESEND_API_KEY}`)
    assert.equal(calls[1].headers['Idempotency-Key'], `contact/${valid.submissionId}`)
  })
})

test('retrying an ambiguous provider failure reuses the same idempotency key with a fresh Turnstile token', async () => {
  const providerKeys = []
  for (const [token, delivery] of [['first-token', new TypeError('Response lost after acceptance')], ['fresh-token', { id: 'original-provider-id' }]]) {
    await mocked([verification, delivery], async calls => {
      const response = await onRequest({ request: request({ ...valid, turnstileToken: token }), env })
      assert.equal(response.status, delivery instanceof Error ? 502 : 200)
      providerKeys.push(calls[1].headers['Idempotency-Key'])
      assert.equal(calls[0].body.response, token)
    })
  }
  assert.deepEqual(providerKeys, [`contact/${valid.submissionId}`, `contact/${valid.submissionId}`])
})

test('provider HTTP errors, invalid responses and network failures never report success or leak data', async () => {
  for (const responses of [
    [new Response('unavailable', { status: 503 })],
    [new TypeError('Network unavailable')],
    [verification, Response.json({ message: 'private provider error' }, { status: 429 })],
    [verification, {}],
    [verification, new Response('not JSON')],
    [verification, new TypeError('Timeout')],
  ]) await mocked(responses, async () => {
    const response = await onRequest({ request: request(), env })
    assert.equal(response.status, 502)
    const body = await response.json()
    assert.equal(body.success, false)
    assert.deepEqual(Object.keys(body).sort(), ['code', 'success'])
  })
})
