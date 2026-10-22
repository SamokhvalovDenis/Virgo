import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'

// Optional audit tooling is isolated from the production dependency graph.
const toolRoot = resolve('node_modules/.cache/virgo-audit/node_modules')
const { default: lighthouse } = await import(pathToFileURL(resolve(toolRoot, 'lighthouse/core/index.js')))
const { launch } = await import(pathToFileURL(resolve(toolRoot, 'chrome-launcher/dist/chrome-launcher.js')))
const { default: AxeBuilder } = await import(pathToFileURL(resolve(toolRoot, '@axe-core/playwright/dist/index.mjs')))
const phase = process.argv[2] || 'after'
if (!/^[a-z0-9-]+$/.test(phase)) throw new Error('Audit phase must contain only lowercase letters, digits and hyphens.')
const root = resolve(process.argv[3] || 'dist')
const output = `reports/prelaunch/${phase}`
const routes = ['/', '/sluzby/masaze', '/sluzby/depilace', '/sluzby/trvale-odstraneni-chloupku', '/sluzby/oboci-a-rasy']
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  if (pathname.includes('..')) { response.writeHead(403).end(); return }
  const candidates = pathname === '/' ? ['index.html'] : [pathname.slice(1), `${pathname.slice(1)}.html`, `${pathname.slice(1)}/index.html`]
  let body, file
  for (const candidate of candidates) {
    try { body = await readFile(resolve(root, candidate)); file = candidate; break } catch { /* Try extensionless routing. */ }
  }
  if (!body) {
    try { body = await readFile(resolve(root, '404.html')); response.statusCode = 404; file = '404.html' }
    catch { body = await readFile(resolve(root, 'index.html')); file = 'index.html' }
  }
  response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
  if (process.argv.includes('--gzip') && /\btext\/|\.svg$|\.json$/.test(types[extname(file)] || file) && request.headers['accept-encoding']?.includes('gzip')) {
    body = gzipSync(body)
    response.setHeader('Content-Encoding', 'gzip')
    response.setHeader('Vary', 'Accept-Encoding')
  }
  response.end(body)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
await mkdir(output, { recursive: true })
let chrome, browser
async function closeChrome() {
  if (!chrome) return
  const instance = chrome
  chrome = null
  try {
    const connection = await chromium.connectOverCDP(`http://127.0.0.1:${instance.port}`)
    const session = await connection.newBrowserCDPSession()
    await session.send('Browser.close').catch(() => {})
    await connection.close().catch(() => {})
  } catch { await instance.kill() }
}
const summary = process.argv.includes('--axe-only') ? JSON.parse(await readFile(`${output}/summary.json`, 'utf8')) : { phase, compression: process.argv.includes('--gzip') ? 'gzip for text' : 'none', lighthouseVersion: '13.5.0', lighthouse: [], axe: [] }
summary.axe = []
try {
  if (!process.argv.includes('--axe-only')) {
  const profile = resolve(`node_modules/.cache/lighthouse-${phase}-${Date.now()}`)
  await mkdir(profile, { recursive: true })
  chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'], userDataDir: profile, handleSIGINT: false })
  for (const [route, desktop] of [['/', false], ['/sluzby/masaze', false], ['/', true]]) {
    if (process.argv.includes('--home-only') && (route !== '/' || desktop)) continue
    const name = `${route === '/' ? 'home' : 'masaze'}-${desktop ? 'desktop' : 'mobile'}`
    const result = await lighthouse(`${origin}${route}`, {
      port: chrome.port, logLevel: 'error', output: ['json', 'html'], onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      ...(desktop ? { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } } : {}),
    })
    await writeFile(`${output}/${name}.lighthouse.json`, result.report[0])
    await writeFile(`${output}/${name}.lighthouse.html`, result.report[1])
    const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)]))
    const metrics = Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'first-contentful-paint', 'speed-index'].map(key => [key, result.lhr.audits[key].numericValue]))
    summary.lighthouse.push({ name, route, scores, metrics, runtimeError: result.lhr.runtimeError, warnings: result.lhr.runWarnings })
    console.log(`${phase} ${name}: ${JSON.stringify({ scores, metrics })}`)
    await writeFile(`${output}/summary.json`, JSON.stringify(summary, null, 2))
  }
  await closeChrome()
  }
  if (!process.argv.includes('--lighthouse-only')) {
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 1440]) for (const route of routes) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const requests = []
    page.on('request', request => { if (request.method() !== 'GET') requests.push(request.method()) })
    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' })
    await page.evaluate(async () => { document.querySelectorAll('img').forEach(image => { image.loading = 'eager' }); await Promise.all([...document.images].map(image => image.decode())); await document.fonts.ready })
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    const name = `${route === '/' ? 'home' : route.split('/').at(-1)}-${width}`
    await writeFile(`${output}/${name}.axe.json`, JSON.stringify(result, null, 2))
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true, animations: 'disabled' })
    summary.axe.push({ name, violations: result.violations.map(({ id, impact, nodes }) => ({ id, impact, count: nodes.length })), incomplete: result.incomplete.map(({ id, nodes }) => ({ id, count: nodes.length })), nonGetRequests: requests })
    console.log(`${phase} axe ${name}: ${result.violations.length} violations`)
    await context.close()
  }
  }
} finally {
  if (browser) await browser.close()
  await closeChrome()
  await new Promise(resolve => server.close(resolve))
  await writeFile(`${output}/summary.json`, JSON.stringify(summary, null, 2))
}
