import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer, preview } from 'vite'
import { chromium } from 'playwright'

const valid = { name: 'Test klient', email: 'contact-test@example.com', phone: '', serviceId: '', message: 'Testovací dotaz ke službě.' }
const output = new URL('../reports/qa/contact-form/', import.meta.url)
const servers = []
let browser, successServer, errorServer, schema, data
const browserErrors = []
const submissions = []
// Keep fixed site navigation out of screenshots of the form itself.
const screenshotStyle = '.site-header, .mobile-booking { visibility: hidden; }'
const mockDefine = result => ({
  'import.meta.env.VITE_CONTACT_MODE': JSON.stringify('mock'),
  'import.meta.env.VITE_CONTACT_MOCK_RESULT': JSON.stringify(result),
})

async function startDev(result) {
  const server = await createServer({
    envFile: false, logLevel: 'error', define: mockDefine(result),
    cacheDir: `node_modules/.vite-contact-${result}`,
    // Source edits by other audit checks must not reload an in-flight form test.
    server: { host: '127.0.0.1', port: 0, open: false, hmr: false, watch: null },
  })
  servers.push(server)
  await server.listen()
  return server
}

async function openForm(server = successServer, width = 1280) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
  page.on('pageerror', error => browserErrors.push(error.message))
  page.on('request', request => {
    if (request.method() === 'POST' || request.url().includes('/api/contact')) submissions.push(request.url())
  })
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' })
  const form = page.getByRole('form', { name: 'Napište nám' })
  await form.scrollIntoViewIfNeeded()
  return { page, form }
}

async function fill(form, values = valid) {
  for (const key of ['name', 'email', 'phone', 'message']) await form.locator(`[name="${key}"]`).fill(values[key] ?? '')
  await form.locator('select').selectOption(values.serviceId ?? '')
}

async function submit(form) {
  await form.getByRole('button', { name: 'Odeslat zprávu', exact: true }).click()
}

async function result(form, message) {
  await form.locator('.form-status').waitFor({ state: 'visible' })
  assert.equal(await form.getByRole('status').innerText(), message)
  assert.equal(await form.getAttribute('aria-busy'), 'false')
}

before(async () => {
  await mkdir(output, { recursive: true })
  successServer = await startDev('success')
  errorServer = await startDev('error')
  schema = await successServer.ssrLoadModule('/src/lib/contactSchema.ts')
  data = await successServer.ssrLoadModule('/src/data/index.ts')
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  if (browser) await browser.close()
  await Promise.all(servers.map(server => server.close()))
})

test('schema validates trimmed required fields, optional fields, phone formats and all boundaries', () => {
  const { contactSchema } = schema
  assert.deepEqual(contactSchema.parse({ ...valid, name: ' Test klient ', email: ' contact-test@example.com ', message: ' Test dotaz ' }), { ...valid, message: 'Test dotaz' })
  assert.ok(contactSchema.safeParse({ name: 'Test klient', email: valid.email, message: valid.message }).success)
  for (const phone of ['', '+420 777 000 000', '(777) 000-000', '777000000']) assert.ok(contactSchema.safeParse({ ...valid, phone }).success, phone)
  for (const phone of ['abc', '123', '+1234567890123456', '777<script>', '7'.repeat(31)]) assert.ok(!contactSchema.safeParse({ ...valid, phone }).success, phone)
  for (const [key, values] of Object.entries({ name: ['', ' ', 'x', 'x'.repeat(101)], email: ['', 'abc', 'x'.repeat(255) + '@example.com'], message: ['', ' ', 'x', 'x'.repeat(2001)], serviceId: ['unknown', 'massage-honey'] })) {
    for (const value of values) assert.ok(!contactSchema.safeParse({ ...valid, [key]: value }).success, `${key}: ${value.length}`)
  }
  assert.ok(contactSchema.safeParse({ ...valid, name: 'x'.repeat(100), message: 'x'.repeat(2000) }).success)
  for (const category of schema.contactServiceCategories) assert.ok(contactSchema.safeParse({ ...valid, serviceId: category.id }).success)
  assert.ok(contactSchema.safeParse({ ...valid, serviceId: data.giftCertificates.contactFormTopic }).success)
})

test('submitContact uses a uniform result, validates input and simulates both outcomes with a delay', async () => {
  const success = await successServer.ssrLoadModule('/src/lib/contact.ts')
  const error = await errorServer.ssrLoadModule('/src/lib/contact.ts')
  assert.equal(success.isContactMockMode, true)
  assert.equal((await success.submitContact({ ...valid, email: 'abc' })).code, 'INVALID_INPUT')
  const started = performance.now()
  assert.deepEqual(await success.submitContact(valid), { success: true, message: data.content.form.mockSuccess })
  assert.ok(performance.now() - started >= 950)
  assert.deepEqual(await error.submitContact(valid), { success: false, code: 'MOCK_ERROR', message: data.content.form.mockError })
})

test('form renders Czech labels, category options, mock notice and an accessible status region', async () => {
  const { page, form } = await openForm()
  try {
    for (const label of ['Jméno', 'E-mail', 'Telefon (nepovinné)', 'Služba (nepovinné)', 'Zpráva']) assert.equal(await form.getByLabel(label, { exact: false }).count(), 1)
    assert.equal(await form.locator('#form-mock-notice').innerText(), data.content.form.mockNotice)
    assert.equal(await form.getByRole('status').getAttribute('aria-live'), 'polite')
    assert.deepEqual(await form.locator('select option').evaluateAll(options => options.map(option => option.value)), ['', data.giftCertificates.contactFormTopic, ...schema.contactServiceCategories.map(category => category.id)])
    assert.equal(await form.getByRole('button').isEnabled(), true)
  } finally { await page.close() }
})

test('empty form focuses the first error; invalid email and phone errors clear on correction', async () => {
  const { page, form } = await openForm()
  try {
    await submit(form)
    assert.equal(await form.locator('.field-error').count(), 3)
    assert.equal(await page.locator(':focus').getAttribute('name'), 'name')
    await fill(form, { ...valid, email: 'abc', phone: 'abc' })
    await submit(form)
    assert.equal(await form.locator('#error-email').innerText(), data.content.form.validation.email)
    assert.equal(await form.locator('#error-phone').innerText(), data.content.form.validation.phone)
    assert.equal(await form.locator('[name="email"]').getAttribute('aria-describedby'), 'error-email')
    await form.locator('[name="email"]').fill(valid.email)
    await form.locator('[name="phone"]').fill('')
    assert.equal(await form.locator('.field-error').count(), 0)
    assert.equal(await form.getAttribute('aria-busy'), 'false')
    await form.locator('[name="message"]').fill('x'.repeat(2001))
    await submit(form)
    assert.equal(await form.locator('#error-message').innerText(), data.content.form.validation.message)
  } finally { await page.close() }
})

test('valid submission disables repeated sends, shows the spinner, resets every field and supports a new message', async () => {
  const { page, form } = await openForm()
  try {
    await fill(form, { ...valid, phone: '+420 777 000 000', serviceId: schema.contactServiceCategories[0].id })
    await submit(form)
    const button = form.getByRole('button', { name: 'Odesílání...' })
    assert.equal(await button.isDisabled(), true)
    assert.equal(await form.locator('.form-spinner').count(), 1)
    assert.equal(await form.getAttribute('aria-busy'), 'true')
    assert.equal(await form.locator('[name="message"]').isDisabled(), true)
    // Programmatic duplicate submit exercises the synchronous guard too.
    await form.evaluate(element => { element.requestSubmit(); element.requestSubmit() })
    await result(form, data.content.form.mockSuccess)
    for (const key of ['name', 'email', 'phone', 'serviceId', 'message']) assert.equal(await form.locator(`[name="${key}"]`).inputValue(), '')
    await fill(form)
    assert.equal(await form.getByRole('status').innerText(), '')
    await submit(form)
    await result(form, data.content.form.mockSuccess)
    assert.equal(await page.evaluate(() => localStorage.length), 0)
    await form.screenshot({ path: fileURLToPath(new URL('success-desktop.png', output)), style: screenshotStyle })
  } finally { await page.close() }
})

test('mock error preserves all input and permits a second submission', async () => {
  const { page, form } = await openForm(errorServer)
  const values = { ...valid, phone: '+420 777 000 000', serviceId: schema.contactServiceCategories[0].id }
  try {
    await fill(form, values)
    for (let attempt = 0; attempt < 2; attempt++) {
      await submit(form)
      await result(form, data.content.form.mockError)
      for (const [key, value] of Object.entries(values)) assert.equal(await form.locator(`[name="${key}"]`).inputValue(), value)
      assert.equal(await form.getByRole('button').isEnabled(), true)
    }
    await form.screenshot({ path: fileURLToPath(new URL('error-desktop.png', output)), style: screenshotStyle })
  } finally { await page.close() }
})

test('App gift-card action sets the contact topic and successful submission clears it', async () => {
  const { page, form } = await openForm()
  try {
    await page.locator('#gifts').getByRole('link', { name: data.content.sections.giftsButton }).click()
    assert.equal(await form.locator('select').inputValue(), data.giftCertificates.contactFormTopic)
    await fill(form, { ...valid, serviceId: data.giftCertificates.contactFormTopic })
    await submit(form)
    await result(form, data.content.form.mockSuccess)
    assert.equal(await form.locator('select').inputValue(), '')
  } finally { await page.close() }
})

test('keyboard navigation, focus and submission work at mobile and desktop widths without overflow', async () => {
  for (const width of [320, 390, 768, 1280]) {
    const { page, form } = await openForm(successServer, width)
    try {
      await form.locator('[name="name"]').focus()
      assert.notEqual(await form.locator('[name="name"]').evaluate(element => getComputedStyle(element).outlineStyle), 'none')
      await page.keyboard.type(valid.name)
      await page.keyboard.press('Tab')
      await page.keyboard.type(valid.email)
      await page.keyboard.press('Tab')
      assert.equal(await page.locator(':focus').getAttribute('name'), 'phone')
      await page.keyboard.press('Tab')
      assert.equal(await page.locator(':focus').getAttribute('name'), 'serviceId')
      await page.keyboard.press('Tab')
      await page.keyboard.type(valid.message)
      await page.keyboard.press('Tab')
      assert.equal(await form.getByRole('button').evaluate(element => element === document.activeElement), true)
      await page.keyboard.press('Enter')
      await result(form, data.content.form.mockSuccess)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`)
      await form.screenshot({ path: fileURLToPath(new URL(`success-${width}.png`, output)), style: screenshotStyle })
    } finally { await page.close() }
  }
})

test('production ignores mock variables, omits test UI and never reports a false success', async () => {
  const outDir = 'node_modules/.tmp/contact-production'
  // Isolate NODE_ENV: the dev servers in this test process set it to development.
  const config = { envFile: false, define: mockDefine('success'), logLevel: 'error', build: { outDir, emptyOutDir: true } }
  await promisify(execFile)(process.execPath, ['--input-type=module', '-e', `import { build } from 'vite'; await build(${JSON.stringify(config)})`], {
    env: { ...process.env, NODE_ENV: 'production' }, windowsHide: true,
  })
  const server = await preview({ envFile: false, logLevel: 'error', build: { outDir }, preview: { host: '127.0.0.1', port: 0, open: false } })
  const { page, form } = await openForm(server)
  try {
    assert.equal(await form.getByRole('button').isDisabled(), true)
    assert.equal(await form.locator('#form-availability').innerText(), data.content.form.disabled)
    assert.equal(await form.locator('#form-mock-notice').count(), 0)
    await fill(form)
    await form.evaluate(element => element.requestSubmit())
    assert.equal(await form.getByRole('status').innerText(), '')
    assert.ok(!(await form.innerText()).includes(data.content.form.mockSuccess))
    const manifest = await readFile(`${outDir}/index.html`, 'utf8')
    assert.ok(manifest.includes('/assets/'))
  } finally {
    await page.close()
    await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
  }
})

test('configured production form uses Turnstile, preserves failed input and accepts only a successful API response', async () => {
  const outDir = 'node_modules/.tmp/contact-real-production'
  const config = {
    envFile: false, logLevel: 'error', build: { outDir, emptyOutDir: true },
    define: {
      'import.meta.env.VITE_CONTACT_MODE': JSON.stringify('production'),
      'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify('test-sitekey'),
      'import.meta.env.VITE_CONTACT_PRIVACY_URL': JSON.stringify('/test-privacy'),
    },
  }
  await promisify(execFile)(process.execPath, ['--input-type=module', '-e', `import { build } from 'vite'; await build(${JSON.stringify(config)})`], {
    env: { ...process.env, NODE_ENV: 'production' }, windowsHide: true,
  })
  const server = await preview({ envFile: false, logLevel: 'error', build: { outDir }, preview: { host: '127.0.0.1', port: 0, open: false } })
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' })
  page.on('pageerror', error => browserErrors.push(error.message))
  const requests = []
  let acceptsMessage = false
  // All third-party verification and API requests are intercepted. No real tokens or email.
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({
    contentType: 'text/javascript', body: `window.turnstile = {
      render(element, options) { window.testVerification = options; element.textContent = 'Testovací ověření'; setTimeout(() => options.callback('test-token'), 50); return 'test-widget'; },
      reset() { setTimeout(() => window.testVerification.callback('fresh-test-token'), 50); },
      remove() {}
    };`,
  }))
  await page.route('**/api/contact', async route => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({ status: acceptsMessage ? 200 : 503, contentType: 'application/json', body: JSON.stringify({ success: acceptsMessage }) })
  })
  try {
    await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' })
    const form = page.getByRole('form', { name: data.content.sections.contactFormTitle })
    await form.scrollIntoViewIfNeeded()
    assert.equal(await form.locator('#form-mock-notice').count(), 0)
    assert.equal(await form.locator('#form-availability').count(), 0)
    assert.equal(await form.getByRole('link', { name: data.content.form.privacyLink }).getAttribute('href'), '/test-privacy')
    await fill(form)
    await submit(form)
    await result(form, data.content.form.error)
    assert.equal(await form.locator('[name="message"]').inputValue(), valid.message)
    assert.equal(requests.length, 1)
    assert.equal(requests[0].turnstileToken, 'test-token')
    assert.equal(requests[0].website, '')
    assert.match(requests[0].submissionId, /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i)
    acceptsMessage = true
    await submit(form)
    await result(form, data.content.form.success)
    assert.equal(requests.length, 2)
    assert.equal(requests[1].turnstileToken, 'fresh-test-token')
    assert.equal(requests[1].submissionId, requests[0].submissionId, 'An unchanged retry retains the provider idempotency key')
    assert.equal(await form.locator('[name="message"]').inputValue(), '')
    await page.waitForFunction(() => !document.querySelector('.form-submit').disabled)
    await page.evaluate(() => window.testVerification['expired-callback']())
    await page.waitForFunction(() => document.querySelector('.form-submit').disabled)
    assert.equal(await form.getByRole('button', { name: data.content.common.send, exact: true }).isDisabled(), true)
    await page.evaluate(() => window.testVerification['error-callback']())
    await form.getByRole('button', { name: data.content.form.verificationRetry }).click()
    await page.waitForFunction(() => !document.querySelector('.form-submit').disabled)
    assert.equal(requests.length, 2)
    acceptsMessage = false
    await fill(form)
    await submit(form)
    await result(form, data.content.form.error)
    assert.notEqual(requests[2].submissionId, requests[1].submissionId, 'A new message after success receives a new key')
    const changed = { ...valid, message: 'Jiný testovací dotaz.' }
    await fill(form, changed)
    await submit(form)
    await result(form, data.content.form.error)
    assert.notEqual(requests[3].submissionId, requests[2].submissionId, 'Changed normalized input receives a new key')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  } finally {
    await page.close()
    await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
  }
})

test('all contact flows complete without browser errors or HTTP submissions', () => {
  assert.deepEqual(browserErrors, [])
  assert.deepEqual(submissions, [])
})
