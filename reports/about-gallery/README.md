# O nás — editorial bento gallery

The section keeps both existing Czech paragraphs, all three values and the shared
`BookingButton` (including its Termino URL and analytics). Other sections are unchanged.

## Images

All six photographs come from the original site's **Virgo studio** gallery:
https://virgostudio.godaddysites.com/

| Position | Photograph | Source filename |
| --- | --- | --- |
| Large feature | Studio overview | `photo_4_2024-10-28_16-03-39.jpg` |
| Upper right | Waiting area with two chairs | `photo_1_2024-10-28_16-03-39.jpg` |
| Middle right | Reception with certificates | `blob-3281e6a.png` |
| Bottom left | Massage room | `photo_3_2024-10-28_16-03-39.jpg` |
| Bottom center | Candle detail | `photo_2_2024-10-28_16-03-39.jpg` |
| Bottom right | Equipment and cabinets | `photo_2024-10-28_16-10-12.jpg` |

The old 370 px downloads in `public/images/virgo-original/` are preserved.
The same sources at their full resolution (1280 px landscape, 960 × 1280 reception)
are saved in `public/images/about/gallery/`. WebP previews total **424,298 bytes**;
individual previews range from 19,738 to 118,678 bytes. Unmodified originals load
only when opening the lightbox. Gallery images are lazy-loaded, have explicit
dimensions, and occupy a stable grid. Portrait reception cropping is intentional;
the lightbox always shows its entire original frame.

Source URLs, exact dimensions and sizes are in `source-images.json`.
`node --use-system-ca reports/inspect-about-source.mjs` reproduces the downloads,
WebP compression and original-site screenshot. The system CA flag uses the host's
trusted certificate store.

## Validation

- `npm.cmd run typecheck` — passed.
- `npm.cmd run lint` — passed.
- `npm.cmd test` — 27/27 passed.
- `npm.cmd run build` — passed.
- `node tests/about.browser.mjs` — passed at 320, 375, 390, 768, 1024 and 1440 px.

Browser checks cover six unique local photos, loaded images, preserved copy and
booking link, desktop/mobile grid geometry, no horizontal overflow, opening each
photo, uncropped full-size originals, previous/next buttons, keyboard navigation
and wrapping, Escape and backdrop dismissal, Tab/Shift+Tab focus containment,
focus restoration, background scroll lock, mobile touch swipes, hover and reduced
motion. No browser errors were reported. Touch gestures are dispatched through
Chromium's touch input protocol; physical mobile devices were not tested.

`browser-results.json` records the results. `about-*.png` shows the six requested
viewport widths; `lightbox-390.png` and `lightbox-1440.png` show the modal.
Section screenshots hide fixed navigation only for capture so it cannot cover
the section. Production navigation is unchanged.
