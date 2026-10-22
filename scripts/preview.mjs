import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
}

/** Static Pages route behavior only; Pages Functions still require Wrangler/Cloudflare. */
export async function createStaticPreview({ directory = resolve('dist'), port = 0 } = {}) {
  const root = resolve(directory)
  const isFile = async file => { try { return (await stat(file)).isFile() } catch { return false } }
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end()
        return
      }
      const url = new URL(request.url, 'http://localhost')
      const pathname = decodeURIComponent(url.pathname)
      const candidate = resolve(root, `.${pathname}`)
      const within = relative(root, candidate)
      if (pathname.includes('\0') || within.startsWith('..') || isAbsolute(within)) {
        response.writeHead(400).end()
        return
      }
      const redirect = destination => response.writeHead(301, { Location: `${destination}${url.search}` }).end()
      if (pathname === '/index.html') return redirect('/')
      if (pathname.endsWith('.html') && pathname !== '/404.html' && await isFile(candidate)) return redirect(pathname.slice(0, -5))
      if (pathname !== '/' && pathname.endsWith('/') && await isFile(`${candidate}.html`)) return redirect(pathname.slice(0, -1))
      let file = candidate
      if (pathname === '/') file = resolve(root, 'index.html')
      else if (!extname(pathname) && await isFile(`${candidate}.html`)) file = `${candidate}.html`
      const hidden = ['/_headers', '/_redirects', '/_routes.json'].includes(pathname)
      const found = !hidden && await isFile(file) && pathname !== '/404.html'
      if (!found) file = resolve(root, '404.html')
      const body = await readFile(file)
      response.writeHead(found ? 200 : 404, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
      response.end(request.method === 'HEAD' ? undefined : body)
    } catch {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request')
    }
  })
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', accept) })
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((accept, reject) => server.close(error => error ? reject(error) : accept())),
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const preview = await createStaticPreview({ port: Number(process.env.PORT ?? 4173) })
  console.log(`Local static Pages preview: ${preview.origin}`)
  console.log('Pages Functions are not executed by this preview.')
}
