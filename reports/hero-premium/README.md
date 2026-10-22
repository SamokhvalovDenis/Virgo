# Premium Hero verification

The Hero follows the supplied reference with a burgundy gradient, a two-line cream/gold
Playfair Display heading, gold pill buttons, outlined circular check icons, three
overlapping photo frames, a double-ring lotus emblem, botanical SVGs and a bottom
navigation strip. The Hero uses the shared site container and standard button sizes.
The desktop heading is capped at 56 px, body copy at 16 px and the photo composition
at 540 px, keeping its scale consistent with the other sections. The emblem is
112 px on desktop and 90 px on mobile.
On mobile, the copy and actions precede the main 4:3 photo, two smaller photos and
the benefits. All Hero responsive styles live in `Hero.css`.

## Photographs

All three photos are existing, verified Virgo gallery images. Originals and the
gallery data were preserved; existing responsive WebP derivatives are reused.

| Position | Source |
| --- | --- |
| Main: two chairs and round table | `public/images/about/gallery/virgo-5e46a6a8e504.jpg` |
| Upper detail: candles | `public/images/about/gallery/virgo-f04a78ef8962.webp` |
| Lower detail: massage room | `public/images/about/gallery/virgo-05beda091c66.webp` |

The authentic studio photos differ from the staged interiors in the visual reference.
No AI editing, filters, replacement interiors or external stock photos were used.
Desktop frames crop with `object-fit: cover`; mobile retains the main photo's 4:3 frame.
The main image loads eagerly with high fetch priority. The detail images load lazily.
Explicit dimensions and reserved frame ratios prevent image layout shifts.

## Browser evidence

Run `npm run test:hero:browser`, or the full `npm run test:browser` suite.
Hero checks run against the production build in headless Chromium at 320, 375, 390,
767, 768, 1024, 1200, 1280, 1440 and 1672 px. `browser-results.json` records:

- Two heading lines, no clipped controls and no horizontal page overflow.
- Three decoded local photos selected from responsive WebP sources.
- Correct column separation and mobile content order.
- Initial cumulative layout shift of 0 at every tested width.
- The actual booking click opens the configured URL in a new tab. The request is
  intercepted locally, so this test does not contact Termino or create a booking.
- Both service links work by keyboard and leave the destination below the sticky header.
- Visible keyboard focus with at least 3:1 contrast against the Hero base color;
  secondary action text has at least 4.5:1 contrast against that base color.
- Smooth scrolling normally, instant scrolling with reduced-motion preference.
- No JavaScript exceptions.

`hero-1672.png` matches the reference's viewport dimensions. `hero-1440.png` is an
additional desktop capture. `hero-390.png` shows the complete mobile Hero;
`mobile-390-viewport.png` shows a normal 390 × 844 viewport including the existing
fixed booking bar. Other `hero-WIDTH.png` files document the remaining breakpoints.

## Scope

Header, original logo, contacts, booking configuration and analytics, service names,
routes, metadata and other section implementations are unchanged. `StudioImage`
accepts an optional `sizes` override, with its existing defaults preserved elsewhere.
The site image-count assertion includes the two additional Hero photos.
No dependencies were added. No push or deployment was performed.

## Scale refinement checks — 2026-10-22

- `npm run lint`: passed.
- `npm run test:hero:browser`: production TypeScript/client/SSR build and all ten
  responsive cases passed after the sizing adjustment. Screenshots and
  `browser-results.json` reflect the smaller final layout.
- Both service links, the configured booking URL, visible keyboard focus, image
  loading and reduced-motion behavior passed. Initial CLS remains 0, with no overflow.

## Initial redesign checks — 2026-10-22

- `npm run lint`: passed.
- `npm test`: 44 tests passed.
- `npm run build`: TypeScript and client/SSR production builds passed.
- `npm run test:browser`: passed in one complete final run, covering Hero at ten
  widths, prices (40 cases), gallery (10 widths), reviews (13 widths), readiness
  (50 route/viewport cases), prerendering/SEO and asset decoding/font parity.

The existing build notice about unset `VITE_SITE_URL` remains: canonical URLs,
absolute social-image URLs and a sitemap are conditionally omitted as before.
