import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Read-only snapshot; no Search Console access or verified Googlebot impersonation.
// node --use-system-ca reports/seo/audit-live.mjs reports/seo/live-current.json
const origin = 'https://virgo.beautycz.workers.dev'
const output = process.argv[2] ?? 'reports/seo/live-current.json'
const paths = ['/', '/sluzby/masaze', '/sluzby/depilace', '/sluzby/trvale-odstraneni-chloupku', '/sluzby/oboci-a-rasy']
const agents = {
  browser: 'Mozilla/5.0 (compatible; VirgoTechnicalAudit/1.0)',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
}
const results = []
for (const [agent, userAgent] of Object.entries(agents)) {
  for (const path of [...paths, '/robots.txt', '/sitemap.xml', ...paths.slice(1).map(path => `${path}/`), '/missing-seo-audit']) {
    const response = await fetch(origin + path, { redirect: 'manual', headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(30000) })
    const body = await response.text()
    const attribute = (tag, name) => tag?.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] ?? null
    const tags = [...body.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(match => match[0])
    const meta = name => attribute(tags.find(tag => attribute(tag, 'name') === name), 'content')
    const result = {
      agent, path, status: response.status, location: response.headers.get('location'),
      contentType: response.headers.get('content-type'), xRobotsTag: response.headers.get('x-robots-tag'),
      title: body.match(/<title>(.*?)<\/title>/s)?.[1] ?? null,
      description: meta('description'), robots: meta('robots'),
      canonical: attribute(tags.find(tag => attribute(tag, 'rel') === 'canonical'), 'href'),
      lang: attribute(body.match(/<html\b[^>]*>/i)?.[0], 'lang'),
      h1: [...body.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map(match => match[1].replace(/<[^>]+>/g, '')),
      prerendered: body.includes('data-prerendered="true"'),
      serviceLinks: paths.slice(1).filter(path => body.includes(`href="${path}"`)),
      mainHash: createHash('sha256').update(body.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '').digest('hex'),
      ...(path.endsWith('.txt') || path.endsWith('.xml') ? { body } : {}),
    }
    results.push(result)
    console.log(JSON.stringify(result))
  }
}
await mkdir('reports/seo', { recursive: true })
await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), origin, results }, null, 2) + '\n')
