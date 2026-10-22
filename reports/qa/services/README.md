# Premium Services section

The home page Services section follows the supplied reference: cream background,
large vertical photographs fading into burgundy, outlined gold icon medallions,
light serif titles, underlined gold detail links, aligned champagne booking
buttons, and subtle botanical SVG decoration.

The existing category titles, descriptions, local photographs, detail routes,
booking configuration and booking analytics are retained. The device photograph
is the original project asset; its crop keeps the treatment device visible.
The layout uses four columns from 1200px, two from 768px, and one below 768px.
All production styling changes are scoped to Services; obsolete Services rules
were removed from the shared responsive stylesheet.

The section now uses the site's shared container, heading/subtitle typography
and section spacing. Cards are 480px tall on desktop/tablet and 460px on mobile
(growing if their content needs more room), with 24px titles, 14px descriptions
and button labels, 48px booking controls, and 52px/44px decorative medallions.
This replaces the oversized heading, 620px cards and larger desktop text from
the first version while retaining the burgundy/gold treatment.

## Preview artifacts

- [Desktop, reference width 1672px](services-1672.png)
- [Desktop, 1440px](services-1440.png)
- [Tablet, 768px](services-768.png)
- [Mobile, 390px](services-390.png)
- [Mobile, 320px](services-320.png)
- [Browser results](browser-results.json)

## Verification

Run `npm run test:services:browser` to build and verify the section, or
`node tests/services.browser.mjs` against an existing production build.
The suite also runs as part of `npm run test:browser`.

The Services suite covers 320, 375, 390, 767, 768, 1024, 1199, 1200, 1440 and
1672px, checking exact category content, loaded photos, column counts, equal
card heights and aligned booking buttons within each row, text fit, absence of
horizontal overflow, keyboard focus, all four detail-page navigations, all
booking links and their new-tab behavior, hover motion, and reduced motion.
Booking destinations are fulfilled locally during testing; no booking is made.

At 320px and 1440px, text contrast is measured across the actual rasterized
photo and gradient behind every title, description, detail link and booking
label. The thresholds are 3:1 for large titles and 4.5:1 for other text.
The browser report includes those measurements.

Desktop and mobile screenshots were visually reviewed against the supplied
reference. Real source photos and the existing Playfair Display/Inter fonts
are preserved, so photographic detail and type shapes differ from the reference.

The review carousel regression checks verify that the Services and Reviews
headings and subtitles share the same typography, including their sizes.

Validation completed: TypeScript typecheck, ESLint, all 44 unit/integration
tests, production build, and the complete browser suite (Hero, Services,
Prices, About, Reviews, responsive route readiness, SEO and assets).
After the size normalization, ESLint, the production build (including
TypeScript), and Services and Reviews browser checks were repeated. Services
screenshots and contrast measurements were refreshed for the smaller layout.

No push or deployment was performed.
