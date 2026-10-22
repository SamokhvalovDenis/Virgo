# Production-readiness evidence — 2026-10-21–22

The audit starts from the existing uncommitted working tree, not from Git HEAD. Earlier refactor/review/gallery reports are historical and are not measurements of this optimization.

- `before/`: Lighthouse 13.5.0 reports, axe 4.14.0 reports and screenshots of the preserved initial production build.
- `after/`: the first optimization pass, retained as intermediate evidence.
- `before-gzip/`, `final-gzip/`: the matching compressed before/final Lighthouse samples; `final-gzip/` also holds the final axe audit and screenshots.
- `final-raw/`: the final uncompressed mobile home control, comparable with `before/home-mobile`.
- `responsive/`: the current 50 route/viewport smoke cases and viewport screenshots.
- `seo/`: prerender, no-JavaScript content, hydration, redirects and HTTP-status evidence.
- `images.json`: dimensions/bytes for 178 raster sources and 69 variant references for 31 configured sources (65 WebP files after identical sources are shared). Originals remain intact. Derivatives are alternatives, not files downloaded together.
- `fonts.json`, `assets/browser-results.json`: Inter source/subset sizes, exact Czech text width/pixel comparisons at five weights, decoded responsive images and isolated contact-chunk failure recovery.

Lighthouse uses the same local Node HTTP server for both phases. The initial `before/` and `after/` samples use uncompressed HTTP. Final matching compressed comparisons are in `before-gzip/` and `final-gzip/`; `--gzip` compresses text responses, with no CDN cache or HTTP/2 emulation. Cloudflare supports text compression, but its actual production response must still be verified. Mobile uses Lighthouse's default simulated mobile throttling; desktop uses 1350×940, 1× CPU, 40ms RTT and 10Mbps. These are laboratory samples, not field Core Web Vitals or Cloudflare CDN measurements. TBT is not INP. Run timing audits without concurrent browser suites. Other named directories are intermediate optimization measurements, not the final release result.

Reproduce after `npm ci` and `npm run build`:

```powershell
$env:NODE_OPTIONS='--use-system-ca' # only needed for environments using a system TLS CA
npm.cmd install --prefix node_modules/.cache/virgo-audit --cache .npm-cache --no-save --package-lock=false lighthouse@13.5.0 @axe-core/playwright@4.14.0
node scripts/audit.mjs after dist
node scripts/audit.mjs final-gzip dist --gzip
```

Audit-only packages remain under ignored `node_modules/.cache`; they do not enter the app's dependency graph or deployment. `scripts/audit.mjs` can audit another build directory; the initial build is preserved locally at `node_modules/.cache/virgo-baseline/dist`. `--axe-only` reruns axe/screenshots while preserving that phase's Lighthouse samples.

To regenerate checked-in Inter subsets (normal builds do not need this tool):

```powershell
npm.cmd install --prefix node_modules/.cache/virgo-fonts --cache .npm-cache --no-save --package-lock=false subset-font@2.9.0
npm.cmd run fonts:optimize
npm.cmd run test:assets:browser
```

The original 100–900 weight axis and layout features are retained. Playfair Display files are unchanged. OFL license copies accompany the served fonts. Font and responsive-asset tests compare actual rendering, not just file metadata.

Responsive derivatives can be regenerated with `npm run images:optimize` using the installed Playwright Chromium. The script decodes actual selected source photographs, preserves their aspect ratios and writes separate WebP files; it does not replace originals or generate new scenes. Existing JPEG/WebP `src` remains the fallback while `srcSet` chooses an appropriate size.

No real contact submissions, emails, bookings, deployment, commit or push were performed. Provider and widget tests intercept all requests. Domain, privacy/controller information and provider activation require the owner's confirmed configuration; see `../../PRE_LAUNCH_REPORT.md` and `../../DEPLOYMENT.md`.
