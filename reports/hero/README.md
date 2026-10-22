# Hero verification

Hero uses the unmodified waiting-area photograph from the six-photo studio gallery:
`public/images/about/gallery/virgo-5e46a6a8e504.jpg` (1280 × 960).
Its existing source record is in `../about-gallery/source-images.json`.
Both chairs and the table remain within the original 4:3 frame; no image generation,
retouching or cropping was used. `src/data/assets.ts` maps the Hero to this original.

Verified the production preview in headless Chromium at 320, 390, 767, 768, 1024,
1280 and 1440 px. The image loads at its original proportions, appears below the
copy on mobile and to the right on desktop, and introduces no horizontal overflow.
The Czech heading, subtitle, highlights, caption and both action links are preserved.
The services action resolves to `#services`; booking uses the shared header URL.
No JavaScript errors occurred. Results are in `browser-results.json`; screenshots
include the header and Hero. Mobile screenshots also show the existing fixed booking bar.

`npm.cmd run build`, `npm.cmd run lint` and `npm.cmd test` all passed (27 tests).
