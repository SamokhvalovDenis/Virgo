import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

let server, submitContact, data, schema
const valid = { name: 'Test klient', email: 'client@example.com', phone: '+420 777 000 000', serviceId: '', message: 'Testovací dotaz.\nDruhý řádek.' }
const verification = { hcaptchaToken: 'test-token', website: '' }

before(async () => {
  server = await createServer({
    envFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-web3forms-tests',
    define: { 'import.meta.env.VITE_CONTACT_MODE': JSON.stringify('production') },
    server: { middlewareMode: true, hmr: false, watch: null },
  })
  ;({ submitContact } = await server.ssrLoadModule('/src/lib/contact.ts'))
  data = await server.ssrLoadModule('/src/data/index.ts')
  schema = await server.ssrLoadModule('/src/lib/contactSchema.ts')
})
after(async () => { await server?.close() })

async function mocked(response, run) {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, ...init, body: JSON.parse(init.body) })
    if (response instanceof Error) throw response
    return response
  }
  try { await run(calls) }
  finally { globalThis.fetch = original }
}

test('Web3Forms receives Czech field names without internal service IDs, preserving values and Reply-To', async () => {
  for (const serviceId of ['', data.giftCertificates.contactFormTopic, ...schema.contactServiceCategories.map(category => category.id)]) {
    await mocked(Response.json({ success: true }), async calls => {
      assert.deepEqual(await submitContact({ ...valid, name: ' Test klient ', serviceId }, verification), { success: true, message: data.content.form.success })
      assert.equal(calls.length, 1)
      const call = calls[0]
      assert.equal(call.url, 'https://api.web3forms.com/submit')
      assert.equal(call.method, 'POST')
      assert.equal(call.credentials, 'omit')
      assert.equal(call.headers['Content-Type'], 'application/json')
      assert.deepEqual(call.body, {
        access_key: '2230598f-5e86-432e-8e9d-4a6651ab4b83',
        subject: 'Nová zpráva z webu Beauty Studio Virgo',
        'Jméno': valid.name,
        'E-mail': valid.email,
        'Telefon': valid.phone,
        'Služba': serviceId === data.giftCertificates.contactFormTopic ? data.content.form.giftTopic
          : schema.contactServiceCategories.find(category => category.id === serviceId)?.title ?? data.content.form.selectService,
        'Zpráva': valid.message,
        replyto: valid.email,
        'h-captcha-response': verification.hcaptchaToken, botcheck: false,
      })
      assert.equal(Object.hasOwn(call.body, 'serviceId'), false)
      assert.equal(schema.contactSchema.parse({ ...valid, serviceId }).serviceId, serviceId)
    })
  }
})

test('only HTTP success AND boolean success:true acknowledge a submission', async () => {
  const responses = [
    Response.json({ success: false }), Response.json({ success: 'true' }), Response.json({}), Response.json(null),
    Response.json({ success: true }, { status: 400 }), Response.json({ success: true }, { status: 503 }),
    Response.json({ success: false }, { status: 403 }), Response.json({ success: false }, { status: 429 }),
    new Response('<html>Bad gateway</html>', { status: 502 }), new Response(null, { status: 204 }), new TypeError('Network unavailable'),
  ]
  for (const response of responses) {
    await mocked(response, async calls => {
      assert.deepEqual(await submitContact(valid, verification), { success: false, code: 'CONTACT_ERROR', message: data.content.form.error })
      assert.equal(calls.length, 1)
    })
  }
})

test('invalid fields, missing or oversized captcha, and a filled honeypot never make HTTP requests', async () => {
  await mocked(undefined, async calls => {
    for (const input of [{ ...valid, email: 'invalid' }, { ...valid, name: ' ' }, { ...valid, phone: 'abc' }, { ...valid, message: 'x'.repeat(2001) }, { ...valid, serviceId: 'unknown' }]) {
      assert.equal((await submitContact(input, verification)).code, 'INVALID_INPUT')
    }
    for (const check of [undefined, { ...verification, hcaptchaToken: '' }, { ...verification, hcaptchaToken: 'x'.repeat(8193) }, { ...verification, website: 'spam' }]) {
      assert.equal((await submitContact(valid, check)).code, 'INVALID_INPUT')
    }
    assert.deepEqual(calls, [])
  })
})

test('a stalled request times out and returns the existing Czech error', async t => {
  const original = globalThis.fetch
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let signal
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => {
    signal = init.signal
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })
  try {
    const pending = submitContact(valid, verification)
    t.mock.timers.tick(20_000)
    assert.deepEqual(await pending, { success: false, code: 'CONTACT_ERROR', message: data.content.form.error })
    assert.ok(signal.aborted)
  } finally { globalThis.fetch = original; t.mock.timers.reset() }
})
