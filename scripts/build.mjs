import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'

process.env.NODE_ENV = 'production'

// The server bundle is a build tool only. Only dist/ is deployed.
await build()
const serverDirectory = resolve('node_modules/.cache/virgo-prerender')
await build({
  build: {
    ssr: 'src/entry-server.tsx', outDir: serverDirectory, emptyOutDir: true, copyPublicDir: false,
    rollupOptions: { output: { entryFileNames: 'entry-server.mjs' } },
  },
})
const { render, getHeadTags, getPageMetadata, getSiteOrigin, indexablePaths } = await import(pathToFileURL(resolve(serverDirectory, 'entry-server.mjs')).href)
const origin = getSiteOrigin()
const template = await readFile('dist/index.html', 'utf8')
const stylesheets = await Promise.all((await readdir('dist/assets')).filter(file => file.endsWith('.css')).map(file => readFile(`dist/assets/${file}`, 'utf8')))
const fontUrls = [...new Set(stylesheets.flatMap(css => [...css.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)].map(match => match[1])))]
if (!template.includes('<!--app-html-->') || !template.includes('<!--seo-head-->')) throw new Error('Prerender placeholders are missing from index.html.')

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
function htmlFor(pathname) {
  const metadata = getPageMetadata(pathname, origin)
  const tags = getHeadTags(metadata).map(({ tag, attrs, text = '' }) => {
    const attributes = Object.entries(attrs).map(([key, value]) => `${key}="${escapeHtml(value)}"`).join(' ')
    return `<${tag} data-virgo-seo="" ${attributes}>${tag === 'script' ? `${text}</script>` : ''}`
  }).join('\n    ')
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace('<!--seo-head-->', `${tags}\n${fontUrls.map(url => `<link rel="preload" as="font" type="font/woff2" href="${escapeHtml(url)}" crossorigin>`).join('\n')}`)
    .replace('<div id="root">', '<div id="root" data-prerendered="true">')
    .replace('<!--app-html-->', render(pathname))
}

for (const pathname of indexablePaths) {
  const file = resolve('dist', pathname === '/' ? 'index.html' : `${pathname.slice(1)}.html`)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, htmlFor(pathname))
}
await writeFile('dist/404.html', htmlFor('/404'))
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n${origin ? `\nSitemap: ${origin}/sitemap.xml\n` : ''}`)
if (origin) {
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexablePaths.map(pathname => `  <url><loc>${escapeHtml(`${origin}${pathname}`)}</loc></url>`).join('\n')}\n</urlset>\n`)
} else {
  console.warn('VITE_SITE_URL is unset: canonical URLs, absolute social images and sitemap are omitted. Set the approved HTTPS origin and rebuild before indexing production.')
}
console.log(`Prerendered ${indexablePaths.length} indexable pages and 404.html.`)
