# Virgo Beauty Studio — pre-launch report

Дата: 2026-10-21–22. Середовище: Windows, Node 25.6.1, React 19, Vite 8, Chromium Playwright 156. Аудит проведено на поточній робочій копії з уже наявними незакоміченими змінами. Вони збережені; наведений нижче перелік описує роботу цього аудиту, а не всі відмінності від Git HEAD.

**Висновок: NOT READY FOR DEPLOY.** Технічні виправлення й конфігурацію підготовлено. Власник підтвердив, що домен, email-провайдер і юридичні дані ще не погоджені. Контактна форма за замовчуванням вимкнена; реальна доставка не перевірена й не заявляється як готова. Commit, push, deploy, DNS-зміни, бронювання та реальні листи не виконувалися.

## 1. Що було знайдено та виправлено

| Пріоритет | Початковий стан | Результат |
|---|---|---|
| P0 | Production-форма вимкнена, API лише повертав 503 | Підготовлено gated Turnstile/Resend integration із серверною валідацією та тестами; без погодженої конфігурації залишається вимкненою |
| P0 | Wildcard rewrite повертав HTTP 200 також для невідомих URL послуг | Готові HTML п'яти маршрутів, точкові redirects, справжній `404.html`, API-only Functions routing |
| P1 | Порожній початковий React root; однакові базові metadata для послуг | Build-time prerender без нового фреймворку, унікальні Czech title/description/OG/Twitter у початковому HTML |
| P1 | На 320 px кнопки сторінок відгуків мали ширину 22 px | Мінімум 24 px, axe target-size виправлено |
| P1 | Низький контраст focus ring на світлому фоні та неактивних індикаторів | Контекстні focus outlines і контраст індикаторів понад 3:1 |
| P1 | Вибрані фотографії завантажувалися переважно в одному розмірі | Окремі responsive WebP, `srcSet`/`sizes`, оригінальні fallback `src` збережені |
| P1 | Не було static/API security headers, бракувало захисту `.dev.vars.*` | Додано headers і ignore-правило; секрети залишаються server-only |
| P1 | Немає затвердженої privacy-сторінки/даних контролера/production-домену | Питання задокументовано як блокери, значення не вигадувалися |

Під час тестування prerender виявлено й виправлено додаткову регресію: мобільні відгуки зберігали геометрію трьох колонок після hydration. Тепер CSS визначає 1/2/3 колонки з першого рендеру, а JavaScript керує сторінками й доступністю.

### Змінені файли цього аудиту

- `src/app/App.tsx`, `src/main.tsx`, `src/entry-server.tsx`, `src/components/ui/PageMetadata.tsx`, `src/lib/seo.ts`, `src/pages/ServiceDetailPage.tsx`: спільні metadata, server render і hydration, усунення дубльованого title effect.
- `index.html`, `vite.config.ts`, `scripts/build.mjs`, `scripts/preview.mjs`, `package.json`, `public/_redirects`, `public/_routes.json`: production build, статичні маршрути, redirects, локальний перегляд зі справжнім HTTP 404, команди перевірок.
- `scripts/optimize-images.mjs`, `src/data/imageVariants.ts`, `src/lib/responsiveImage.ts`, `src/components/ui/StudioImage.tsx`, `src/components/ui/AboutGallery.tsx`, `src/components/sections/ServiceDetailBlocks.tsx`, `public/images/optimized/`: responsive-фото без заміни джерел.
- `scripts/optimize-fonts.mjs`, `src/styles/fonts.css`, `public/fonts/`: Inter subset для Latin/Central European glyphs зі збереженою оригінальною віссю 100–900; OFL licenses поруч із файлами. Вигляд і метрики чеського тексту перевірено попіксельно на 400/500/600/650/700.
- `src/styles/index.css`, `src/components/sections/Contact.tsx`, `src/components/ui/PageMetadata.tsx`, `tests/assets.browser.mjs`: Tailwind сканує тільки `src`, валідація форми — окремий lazy chunk із повним SSR HTML і локальним error boundary; development metadata helper виключено з production виконання; перевірка assets і відмови chunk.
- `src/components/layout/Header.tsx`, `src/styles/base.css`, `src/components/ui/ReviewsCarousel.tsx`, `src/components/ui/ReviewsCarousel.css`, `src/components/sections/Contact.css`, `src/components/sections/PriceList.tsx`, `src/components/sections/Services.tsx`: клавіатурне закриття меню, focus contrast, SSR-колонки, touch targets, роль CTA group і приховані від assistive technology декоративні номери.
- `functions/api/contact.ts`, `src/lib/contact.ts`, `src/lib/contactSchema.ts`, `src/lib/turnstile.ts`, `src/data/settings.ts`, `src/data/content.ts`, `src/components/sections/ContactForm.tsx`, `src/components/sections/ContactForm.css`: справжній opt-in adapter, безпечні стани, перевірка й повторні спроби.
- `.gitignore`, `.env.example`, `public/_headers`: захист локальних секретів, public/runtime конфігурація, headers.
- `tests/contact-api.test.mjs`, `tests/contact.test.mjs`, `tests/site.test.mjs`, `tests/seo.test.mjs`, `tests/seo.browser.mjs`, `tests/readiness.browser.mjs`, `tests/helpers/preview.mjs`, `tests/prices.browser.mjs`, `tests/about.browser.mjs`, `tests/reviews.browser.mjs`: meaningful API, SEO, responsive та interaction regressions.
- `scripts/audit.mjs`, `reports/prelaunch/`: Lighthouse, axe, фотоінвентар, JSON-звіти та скриншоти.
- `README.md`, `DEPLOYMENT.md`, `docs/contact-form-testing.md`, `docs/reviews-privacy.md`, `docs/image-extraction.md`, `docs/06-ROADMAP-AND-QA.md`, `docs/09-IMPLEMENTATION.md`, цей звіт: актуальний workflow, юридичні питання й deployment checklist. Історичні документи позначено; команда extraction, файл якої вже був відсутній у робочій копії, зараз не працює.

## 2. Mobile responsiveness

Перевірено `/` і всі чотири `/sluzby/...` на **320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 px**: 50 комбінацій. Горизонтального переповнення не було й у базовій перевірці; перевірено також обрізання headings/buttons і правильність після prerender.

- Header: оригінальний логотип уміщується, збігається з Footer. Меню відкривається Enter, закривається Escape з поверненням фокуса, переходом, Tab і Shift+Tab за межі header. На 320×480 нижня кнопка досяжна прокручуванням. Sticky header не закриває цільові заголовки.
- Hero/services: заголовки й CTA вміщуються, фото мають природні пропорції. Вигляд 320/1440 px переглянуто візуально; палітра, композиція й реальні фото збережені.
- Прайс: 40 category/viewport cases, обидві аудиторії; ціни не обрізаються й не перекривають бронювання, кнопки щонайменше 44 px. Золотий divider і нижній CTA збережені.
- Галерея: 10 ширин, усі шість фото; lightbox має доступне закриття, focus trap/restore, scroll lock, клавіатуру та mobile swipe.
- Відгуки: 13 ширин, включно з межами 767/768 та 1099/1100. Точна геометрія 1/2/3, усі дев'ять текстів/оцінок досяжні, довгі відгуки не обрізаються, autoplay немає.
- Контакти: поля вміщуються; phone/email/map отримали target не менше 44 px. DEV/mock-флоу додатково перевірено на 320/390/768/1280.

Докази: `reports/prelaunch/responsive/browser-results.json`, screenshots поруч, `reports/qa/prices`, `reports/qa/about-gallery`, `reports/qa/reviews`.

## 3. Performance

Lighthouse **13.5.0**, той самий локальний HTTP-сервер для збереженої базової та фінальної production-збірки. Основне порівняння використовує однакове **gzip-стиснення текстових ресурсів**, без CDN cache/HTTP2; початкові результати без стиснення також збережені й позначені окремо. Cloudflare підтримує [стиснення текстових відповідей](https://developers.cloudflare.com/speed/optimization/content/compression/), але фактичне production `Content-Encoding` ще потрібно перевірити. Mobile — стандартний simulated mobile профіль Lighthouse; desktop — 1350×940, 1× CPU, 40 ms RTT, 10 Mbps. Це лабораторні вибірки; production Cloudflare/реальний телефон можуть мати інші результати. Показники з різним режимом стиснення не порівнюються між собою.

| Сторінка / профіль (gzip) | Performance до → після | Accessibility | Best Practices | SEO | LCP, s до → після | FCP, s до → після | TBT, ms до → після | CLS до → після |
|---|---|---|---|---|---|---|---|---|
| Головна, mobile | 79 → **90** | 100 → 100 | 100 → 100 | 100 → 100 | 4.52 → **3.57** | 2.76 → **1.70** | 100 → 61 | 0.00076 → 0 |
| Масажі, mobile | 90 → **96** | 100 → 100 | 100 → 100 | 100 → 100 | 3.03 → **2.64** | 2.72 → **1.37** | 32.5 → 7 | 0.00028 → 0 |
| Головна, desktop | 99 → **100** | 100 → 100 | 100 → 100 | 100 → 100 | 0.85 → **0.66** | 0.58 → **0.43** | 0.5 → 5 | 0.00068 → 0 |

**Mobile LCP ще перевищує ціль 2.5 s** на обох виміряних сторінках. Performance score досяг 90+, але це не означає виконання всіх Core Web Vitals. INP не виміряно. Інші три послуги перевірені функціонально й на всіх ширинах, але окремих Lighthouse performance-вибірок для них немає.

Контроль **без стиснення**, той самий mobile home: Performance **65 → 69**, LCP **6.10 → 6.01 s**, FCP **4.36 → 3.84 s**, TBT **165.5 → 48 ms**, CLS **0.00076 → 0**. Ціль швидкодії в такому режимі не виконується: готовий HTML збільшує raw document, тому production compression потрібно перевірити явно. Це окрема пара вимірювань; 65 без gzip не порівнюється з 90 із gzip.

Повні HTML/JSON-звіти: `reports/prelaunch/before-gzip/`, `reports/prelaunch/final-gzip/`. Початковий raw baseline — `before/`; фінальний raw home — `final-raw/`. Проміжні вимірювання в інших папках не є фінальним результатом. Desktop TBT різниться на кілька мілісекунд між вибірками; це лабораторна варіативність, а не доказ регресії взаємодії.

Причини змін: HTML/hero тепер доступні без очікування запуску React; responsive `srcSet` дає менші фото. Hero залишається eager/high priority, інші фото lazy; dimensions резервують місце. Збережено локальні WOFF2, `font-display: swap` і типографіку. Сумарний запитуваний розмір шрифтів зменшено приблизно зі **193 до 128 КБ** завдяки Inter glyph subsetting; Playfair Display не змінювався. Уся оригінальна вісь Inter 100–900 і layout features залишені, щоб зберегти точні метрики. Чотири реально використовувані font files отримали preload із фактичних build URL. Оригінали залишаються у встановлених Fontsource packages, ліцензії копіюються до `public/fonts/`.

Проаналізовано **178 raster sources**. Для **31 configured source** створено 69 variant references / **65 WebP-файлів** із дедуплікацією однакових джерел. Оригінали не змінено й не видалено. Приклад hero: JPEG 129,064 B; WebP 400 px — 12,834 B, 800 px — 49,272 B. Браузер завантажує обраний розмір, а не всі альтернативи. Повнорозмірні оригінали галереї завантажуються лише при відкритті lightbox. Частина найбільших оригінальних файлів — збережений архів і не запитується сторінками.

Ні великих UI/animation-бібліотек, ні нових runtime-залежностей не додано. Lighthouse/axe/subset-font встановлено окремо в ignored tool directories. Початковий JS зменшено з **394.20 КБ / 119.59 КБ gzip** до **321.42 КБ / 98.06 КБ gzip**; окремий chunk форми — **87.13 / 25.68 КБ**. Загальна сума JS трохи більша за базову, але її валідація не входить у початковий entry. CSS — **50.96 / 11.51 КБ gzip**; явний Tailwind source виключає випадкові utility classes із архівних HTML/JSON-звітів. Повний HTML форми є в prerender; lazy chunk не приховує SEO-контент і має локальну обробку помилки завантаження.

**INP не виміряно**: Lighthouse TBT не дорівнює INP, потрібні польові дані після публікації. Ціль LCP≤2.5 s/CLS≤0.1 оцінюється тут лише лабораторно.

## 4. Accessibility

Автоматична перевірка axe 4.14.0 з WCAG 2 A/AA, 2.1 AA, 2.2 AA: п'ять маршрутів на 320 і 1440 px. Базова перевірка знайшла target-size на домашній 320 px (22 px pagination); решта дев'ять комбінацій не мали автоматичних violations.

Фінальний axe: **0 автоматичних violations у всіх 10 комбінаціях**. На головній залишилося по чотири `incomplete color-contrast` для декоративних номерів 01–04 під service-фото: автоматичний інструмент не визначає фон перекритого тексту. Ручна перевірка підтвердила, що кожен номер повністю перекрито `IMG.service-photo` і він має `aria-hidden="true"`; ці номери не є видимим текстом або засобом керування. Докази — `final-gzip/contrast-manual.json` і `services-1440.png`. Інші маршрути не мають incomplete checks. Generic CTA отримав явну роль group, тому попереднє aria-labelledby зауваження закрито.

Ручні/interaction перевірки включали skip-link `Přeskočit na obsah`, єдиний H1, Tab/Shift+Tab/Enter/Escape, меню, lightbox, відгуки, поля/помилки/статуси форми та reduced motion. Focus contrast: **11.04:1** на hero, **15.23:1** на світлій service card; inactive pagination — **3.28:1**. Семантичні таблиці, labels, alt, live regions і native dialog збережені. Повний ручний аудит зі screen reader/реальними assistive devices не виконано; автоматичний результат не є сертифікацією WCAG.

## 5. SEO та індексація React-сторінок

- П'ять реальних URL мають **готовий HTML до JavaScript**, власний title, description, OG/Twitter та `lang="cs"`. JS-disabled browser tests підтверджують контент послуг; hydration/reload не створює exceptions. Перехід на Next.js не потрібний.
- Невідомі шляхи локальний Pages-like preview повертає як **HTTP 404** із `noindex, follow`. На Cloudflare це забезпечує top-level `404.html`; wildcard SPA rewrite видалено. Functions обмежено `/api/*`.
- `VITE_SITE_URL` приймає лише HTTPS origin. Поки власник не вибрав домен, canonical, `og:url`, абсолютні social images й `sitemap.xml` свідомо відсутні; build попереджає про це. Тести перевіряють також генерацію п'яти URL із test-origin; він не потрапляє в production конфігурацію. `lastmod` не вигадується.
- `robots.txt` генерується під час build; після встановлення домену міститиме посилання на sitemap. Favicon збережено. Production noindex немає на п'яти реальних сторінках; preview indexing потрібно контролювати на Cloudflare.
- JSON-LD `BeautySalon` (підтип `LocalBusiness`) використовує наявні назву, адресу, телефон, email, соцмережі, години й категорії. `Review`/`AggregateRating`, юридичні реквізити чи непідтверджені дані не додані.
- JSON-LD локально розібрано й перевірено тестами. **Rich Results Test і Schema Markup Validator зовні не виконані**; потрібна перевірка після погодження домену. Search Console/фактична Google-індексація ще не перевірялися.

Lighthouse SEO=100 у базовій SPA не підтверджував готовність до індексації кожної послуги; додаткові HTML/status/metadata tests є суттєвою частиною цього аудиту. Доменні HTTPS/canonical redirects і наступні перевірки описано в `DEPLOYMENT.md`.

## 6. Production functionality та виконані перевірки

| Частина | Стан |
|---|---|
| Termino | Всі перевірені CTA/картки/прайси/мобільні посилання ведуть точно на `https://www.termino.eu/r/beauty-studio-litomerice`, без зміни бронювання; `_blank` безпечний. Web-інструмент не зміг відкрити зовнішній endpoint, тому live availability/бронювання не підтверджується. |
| Контактна форма | Default production disabled. Підготовлено реальний adapter, а не mock-success: server checks, Turnstile, Resend acceptance ID. Реальні ключі/доставка відсутні; це P0 blocker. |
| Галерея | PASS локально: усі шість фото, original full-size, touch/keyboard/focus/close. |
| Відгуки | PASS локально: дев'ять незмінених записів із книги, без авторів, фото й вигаданих дат, включно з 4.5/5; джерело правильне. |
| Навігація | PASS локально: усі п'ять URL, reload, anchors, меню, HTTP 404. |
| Cloudflare Functions | API логіка й типи перевірені локально; реальний Pages runtime, secrets, WAF та доставка ще не налаштовані й не тестувалися. |

| Перевірка | Фактичний результат |
|---|---|
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint` | PASS |
| `npm.cmd test` | **44/44 PASS**, 0 failures/skips; включно з API 6 і contact UI 11 |
| `npm.cmd run build` | PASS: Vite client + server build tool + 5 prerendered pages + 404 |
| `node tests/prices.browser.mjs` | PASS: 40 category/width cases, обидві аудиторії |
| `node tests/about.browser.mjs` | PASS: 10 ширин, усі 6 фото та lightbox сценарії |
| `node tests/reviews.browser.mjs` | PASS: 13 ширин, усі 9 відгуків, навігація/resize/reduced motion |
| `node tests/readiness.browser.mjs` | PASS: 50 route/width cases, клавіатура, меню й короткий viewport |
| `node tests/seo.browser.mjs` | PASS: 5 HTML без JS, metadata, hydration/reload, redirects, HTTP 404, відсутність guessed sitemap |
| `node tests/assets.browser.mjs` | PASS: 10 route/width image-decoding cases, однакові metrics/pixels шрифтів на 5 weights, form-chunk failure не прибирає решту сторінки |
| Lighthouse / axe | Виконано; точні результати й межі наведено вище |
| Internal links/assets | Усі section targets, 4 service links, booking href, decoded images/fonts, без небезпечних `_blank` перевірені |
| `git diff --check` | PASS |

Composite browser run зупинився на перевірці, що читала responsive pagination до завершення hydration; тест тепер явно чекає відповідний viewport state. Після виправлення кожен зазначений suite пройдено. Окремо під час оптимізації виявлено й усунено ранній keyboard-event race: hydration стартує одразу, без штучного відкладання на animation frames. Реальні повідомлення/бронювання під час жодної перевірки не надсилалися.

Перші паралельні браузерні запуски мали timeouts через локальне навантаження; послідовні фінальні suites пройшли. Contact test servers отримали `hmr:false`/`watch:null`, щоб уникнути сторонніх перезавантажень під час тестів. Історичний `test:refactor:browser` порівнює старий pixel/content baseline попередньої задачі; після навмисних SEO/assets/form змін він не є release gate, baseline не перезаписувався.

## 7. Security and GDPR

Технічно перевірено:

- Серверні секрети не використовують `VITE_`; `.env*`, `.dev.vars*`, `.wrangler` ignored. У frontend немає виявлених приватних ключів.
- API: явне ввімкнення і повна config, точний HTTPS origin, POST/JSON, bounded UTF-8 body 16 KiB, schema, honeypot, серверний Turnstile hostname/action, timeouts, без журналювання введення чи provider errors. Plain-text email має фіксовані sender/recipient/subject, валідований Reply-To. Для незмінених даних повторна спроба після невизначеної мережевої помилки зберігає submission UUID та Resend `Idempotency-Key`; успіх або зміна даних починає нове надсилання. Успіх означає прийняття провайдером, а не гарантовану доставку.
- Static/API security headers: nosniff, frame protection, referrer policy, помірна CSP, API no-store. Hash-named Vite assets мають immutable cache. `_headers` не застосовується автоматично до Functions, тому API встановлює власні headers. Реальні headers Cloudflare потрібно перевірити після публікації.
- `npm audit --omit=dev`: **0 відомих vulnerabilities** на дату перевірки; це результат npm advisory database, а не гарантія відсутності будь-яких ризиків.
- Додаткові analytics/advertising scripts не додано. У default frontend немає cookie/localStorage/sessionStorage. Turnstile запитується лише після явної production activation.

До активації потрібно налаштувати **Cloudflare WAF rate limiting POST `/api/contact`**; глобального лічильника у Function немає. Після ввімкнення Cloudflare/Turnstile повторно перевірити фактичні cookies/requests і вимоги до consent. Декоративний cookie banner не додано.

Для власниці залишаються: юридичне ім'я/найменування контролера, IČO за застосовності, адреса/контакт запитів, мета й правова підстава, строки зберігання повідомлень/відгуків/згод, доступ і видалення, договори з hosting/email/Turnstile, передачі поза ЄЕЗ, права користувачів та погоджена чеська `Ochrana osobních údajů`. Детальний список і посилання на офіційні джерела — `docs/reviews-privacy.md`.

Згоди/підписи/скани книги не додавалися до репозиторію. Публічні відгуки не мають імен/ініціалів/фото. Дані та тексти не замінено старими Slevomat-матеріалами. Архівні QA-звіти попередніх ітерацій не є джерелом поточного контенту. Повна юридична відповідність GDPR не заявляється.

## 8. Release readiness

| Check | Status | Notes |
|---|---|---|
| Responsive | **PASS** | 50 route/width cases, компонентні suites, немає overflow/clipping/overlap у перевірених сценаріях |
| Performance | **FAIL** | Scores 90/96/100, CLS 0, але mobile LCP 3.57/2.64 s перевищує 2.5 s; INP/production CDN ще не виміряні |
| Accessibility | **PASS** | У межах перевірки: axe 0 violations, keyboard/focus/forms/dialogs; incomplete decorative contrast перевірено вручну, повної WCAG-сертифікації немає |
| SEO | **BLOCKED** | Prerender/metadata/404 PASS; потрібні погоджений домен, canonical/sitemap rebuild і зовнішні validators/Search Console |
| Contact form | **BLOCKED** | Adapter та mock/intercept tests PASS; немає погодженої privacy/config/secrets/verified sender і дозволеного реального тесту доставки |
| Booking | **PASS** | Всі локальні href/CTA правильні; доступність зовнішнього Termino і реальне бронювання потрібно перевірити перед релізом |
| Security | **PASS** | Перевірені технічні controls, default fail-closed, npm advisory 0; WAF/реальні headers і юридична готовність — окремі activation requirements |
| Cloudflare build | **BLOCKED** | Локальний production build PASS, конфігурація/інструкція готові; фактичний Pages build/Functions runtime не запускалися, deploy не дозволений цією задачею |

**NOT READY FOR DEPLOY.** Для зміни висновку потрібні: погоджений домен і canonical/sitemap rebuild; затверджена privacy/controller information; погоджений email provider і налаштовані secrets, verified sender/recipient та Turnstile/WAF; дозволений реальний тест прийняття й доставки email; перевірка реального Pages preview/production HTTP, compression, headers, HTTPS і зовнішнього Termino. Окремо залишається P1 performance warning: повторити вимірювання через справжній CDN і допрацювати mobile LCP до 2.5 s. Повний workflow і rollback — `DEPLOYMENT.md`.
