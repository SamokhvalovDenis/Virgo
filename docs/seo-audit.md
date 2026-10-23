# Технічний SEO-аудит Virgo Beauty Studio

Перевірено 23 жовтня 2026 року. Production: https://virgo.beautycz.workers.dev/. Виправлення підготовлені в локальному репозиторії; commit, push і deployment не виконувалися. Стан Search Console наведений зі слів власника: доступу до приватних звітів Google у цьому аудиті немає.

## Реальні проблеми

1. **Canonical відсутній у початковому HTML всіх п'яти опублікованих сторінок.** `site.seo.canonicalUrl` дорівнював `null`, а `VITE_SITE_URL` не був заданий у перевіреній збірці. Унікальні title/description уже були, проте canonical і `og:url` не генерувалися. Це послаблює узгодженість URL, але саме по собі не доводить причину неіндексації.
2. **Опублікований robots.txt втрачає Sitemap.** `public/robots.txt` містить правильне посилання, але build перезаписував його текстом `User-agent: *` / `Allow: /`, коли origin відсутній. Наявний `public/sitemap.xml` при цьому копіювався у `dist` і залишався доступним: попередження build про відсутній sitemap було неточним.
3. **Невідомі URL на production повертають головну сторінку з HTTP 200.** Перевірений `/missing-seo-audit` віддав той самий основний HTML, що `/`, без HTTP-редиректу. Це небажаний fallback, який може створювати soft 404 та зайві дублі. За відповіддю можна припустити SPA fallback; налаштування Dashboard недоступні, тому точне місце його ввімкнення не встановлене.
4. **Налаштування хостингу в репозиторії описували Pages, хоча поточний сайт працює на Workers.** `_routes.json` регулює Pages Functions і не налаштовує статичні маршрути Workers. Wrangler-конфігурації не було. Наявність `dist/404.html` сама по собі не виправляє Workers, якщо deployment використовує SPA fallback.

Мережеві докази до змін: [live-before.json](../reports/seo/live-before.json). Для кожного URL перевірено звичайний User-Agent і User-Agent Googlebot. Це перевірка поведінки сервера за заголовком, а не запит із підтвердженої IP-адреси Googlebot.

## Що вже працювало

- Усі п'ять production URL відповідають HTTP 200 без перенаправлення на головну. Варіанти чотирьох сторінок послуг із завершальним `/` повертають HTTP 301 на відповідний URL без `/`.
- React маршрутизує за `window.location.pathname`; `App` знаходить сторінку в `serviceDetailPages`. Посилання відкривають новий документ. Обов'язкового React Router для цього немає.
- Проєкт **уже використовує SSG**: `scripts/build.mjs` збирає `src/entry-server.tsx`, викликає `renderToString` для кожного маршруту й записує окремі `dist/sluzby/*.html`. `src/main.tsx` гідратує готову розмітку через `hydrateRoot`.
- Основний текст кожної послуги й HTML-посилання присутні до виконання JavaScript. Сторінки не віддають однаковий текст. Додавати Next.js, runtime SSR, бібліотеки метатегів або ще один пререндерер не потрібно.
- Усі сторінки мають унікальні чеські title/description, один H1, `lang="cs"`, семантичні `header`, `nav`, `main`, `section`, `footer`. Випадкових meta `noindex` або HTTP `X-Robots-Tag: noindex` на цих production URL не виявлено.
- Головна містить справжні `<a href>` на всі чотири сторінки послуг. Локальний production-тест також перейшов кожним посиланням і повернувся назад із вимкненим JavaScript.
- `public/sitemap.xml` містить рівно п'ять правильних URL. Production sitemap відповідає HTTP 200 з XML. `robots.txt` не блокує Googlebot. Додавати вигадані `lastmod` не потрібно.

## Виправлення й файли

| Файл | Зміна |
| --- | --- |
| `src/data/site.ts` | Поточний origin `https://virgo.beautycz.workers.dev` як стандартна SEO-адреса. Домен не змінений. |
| `src/lib/seo.ts` | Актуалізовано коментар про production origin; наявний генератор унікальних метаданих збережений. |
| `scripts/build.mjs` | Обов'язковий production origin; узгоджена генерація robots і sitemap; усунуто гілку, яка прибирала Sitemap та пропускала canonical. |
| `wrangler.json` | Workers Static Assets із `dist`, `html_handling: drop-trailing-slash`, `not_found_handling: 404-page`, ім'ям поточного Worker `virgo`. |
| `.env.example` | Правильний приклад публічної SEO-змінної. Налаштування форми не змінені. |
| `tests/seo.test.mjs` | Регресійна перевірка canonical для реального домену без build-змінної. |
| `tests/seo.browser.mjs` | Обов'язкові правильні canonical/OG URL, HTML без JS, переходи посиланнями, HTTP-статуси, lang, метадані, гідратація, reload, XML-парсер для public/dist sitemap, HTTP 200 robots/sitemap. |
| `tests/readiness.browser.mjs`, `tests/assets.browser.mjs` | Необов'язкова папка результатів у CLI, щоб поточні перевірки не перезаписували історичні звіти. |
| `README.md`, `DEPLOYMENT.md` | Актуальні інструкції щодо Workers, домену, build, 404 та відмінностей від Pages Functions. |
| `docs/seo-audit.md` | Цей звіт. |
| `reports/seo/audit-live.mjs` | Повторюваний read-only збір HTTP/SEO-даних із production. |
| `reports/seo/*.json`, `reports/seo/responsive/`, `reports/seo/assets/` | Фактичні результати перевірок і скриншоти. |

`public/sitemap.xml` та `public/robots.txt` перевірені й залишені без змін: їхній вміст уже правильний. Виправлений саме генератор кінцевих файлів у `dist`. CSS, дизайн, тексти послуг, ціни, відгуки, контактна форма, Resend і залежності не змінені.

## Метадані й готовність маршрутів

Canonical кожної сторінки дорівнює `https://virgo.beautycz.workers.dev` + відповідний шлях у таблиці; для головної це адреса із завершальним `/`.

| Шлях | Title у production HTML | H1 | Локальна перевірка |
| --- | --- | --- | --- |
| `/` | Beauty Studio Virgo \| Masáže a kosmetická péče Litoměřice | Dopřejte si chvíli péče a odpočinku | HTTP 200, canonical `/` |
| `/sluzby/masaze` | Masáže Litoměřice \| Beauty Studio Virgo | Masáže | HTTP 200, власний canonical |
| `/sluzby/depilace` | Depilace Litoměřice \| Beauty Studio Virgo | Depilace | HTTP 200, власний canonical |
| `/sluzby/trvale-odstraneni-chloupku` | Trvalé odstranění chloupků Litoměřice \| Beauty Studio Virgo | Trvalé odstranění chloupků | HTTP 200, власний canonical |
| `/sluzby/oboci-a-rasy` | Péče o obočí a řasy Litoměřice \| Beauty Studio Virgo | Péče o obočí a řasy | HTTP 200, власний canonical |

Точні унікальні meta description і canonical: [production.json](../reports/seo/production.json). Вони перевірені в початковому HTML із вимкненим JavaScript, а не тільки після рендерингу в браузері.

**У локальному production build усі п'ять сторінок готові до індексації за перевіреними технічними критеріями.** На публічному сайті виправлення з'являться після deployment. Новий `wrangler.json` повинен справді використовуватися pipeline; сам локальний файл не змінює вже опублікований Worker. Wrangler runtime-емуляція і Dashboard/WAF-конфігурація не перевірялися; локальний preview не є емулятором Cloudflare. Після deployment потрібна зовнішня повторна перевірка canonical, robots і HTTP 404.

Не встановлено, чому саме Google ще не проіндексував чотири сторінки: повідомлення «URL невідомий Google» не є самостійним доказом проблеми React. Відсутність технічних перешкод та успішний sitemap не гарантують індексацію.

## Виконані перевірки

- `npm run build` — успішно; п'ять статичних HTML-сторінок і `404.html` згенеровані, попередження про origin усунуте.
- `npm test` — **45/45**. Виводилися нефатальні попередження Vite про зайнятий WebSocket-порт 24678; усі тести завершилися з exit code 0. Тести контактного API використовують mock-запити; реальні листи не надсилалися.
- `npm run lint` — успішно.
- `node tests/seo.browser.mjs` — усі п'ять маршрутів без JS, унікальні SEO-метадані, canonical, переходи, перезавантаження з JS і без нього, гідратація без помилок, redirects і справжні локальні 404.
- Sitemap у `public` і `dist` розібрано XML-парсером браузера: правильний namespace і рівно п'ять потрібних URL. Robots і sitemap доступні через локальний HTTP з кодом 200.
- `node tests/readiness.browser.mjs reports/seo/responsive` — **50/50** комбінацій маршрут/ширина: 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 px. Меню, клавіатурна навігація, відсутність горизонтального переповнення, посилання секцій і мобільний viewport 320×480 перевірені. Desktop головної й mobile сторінки послуги також оглянуті на скриншотах.
- `node tests/assets.browser.mjs reports/seo/assets` — зображення декодуються на всіх п'яти маршрутах при 320 і 1440 px; чеські шрифти збережені. Несправність lazy chunk форми не прибирає сторінку.
- Основний `<main>` у build **побайтово збігається** з перевіреним production HTML на всіх п'яти сторінках: [content-preservation.json](../reports/seo/content-preservation.json).

## Що виконати після передачі змін

1. Переглянути diff, зробити commit/push і дочекатися успішного GitHub → Cloudflare deployment. Налаштування поточного Worker: build `npm run build`, deploy `npx wrangler deploy`, конфігурація `wrangler.json` із кореня. Якщо у Cloudflare вже задано `VITE_SITE_URL`, перевірити точний поточний hostname. Не деплоїти старий `dist` і не додавати SPA rewrite. Деталі: [DEPLOYMENT.md](../DEPLOYMENT.md).
2. Перевірити публічні URL повторно. Для збереження нового знімка: `node --use-system-ca reports/seo/audit-live.mjs reports/seo/live-current.json`. Очікування: HTTP 200 і власний canonical на п'яти сторінках; Sitemap у robots; п'ять URL в XML; HTTP 404 на `/missing-seo-audit`. Якщо fallback залишився, перевірити альтернативний Wrangler config, Dashboard і CLI overrides.
3. У Google Search Console вибрати property саме **`https://virgo.beautycz.workers.dev/`**. У **Sitemaps** перевірити статус `/sitemap.xml`; якщо вже успішно оброблений, його не потрібно видаляти. За потреби повторно надіслати ту саму адресу після deployment.
4. Для кожної з чотирьох сторінок послуг відкрити **URL Inspection → Test live URL**. Перевірити доступність для Google, дозвіл індексації й HTML перевіреної сторінки: текст відповідної послуги, правильні title/description/canonical. Якщо Google бачить challenge/403, перевірити правила Cloudflare WAF/Bot protection для справжніх пошукових роботів.
5. Після успішної live-перевірки натиснути **Request indexing** один раз для кожної сторінки. Головну повторно подавати необов'язково, оскільки вона вже індексується.
6. Згодом перевірити **Page indexing**, дату останнього сканування, **User-declared canonical** і **Google-selected canonical** в даних про останню індексацію. Live test не встановлює, який canonical Google остаточно вибере. Якщо залишиться «Discovered – currently not indexed» або «Crawled – currently not indexed», аналізувати конкретні дані повторного сканування й якість/відмінність контенту, а не безпідставно міняти маршрутизацію.

Google пояснює, що [запит повторного сканування](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl) не гарантує включення в індекс, а повторення запиту не прискорює його. Технічні виправлення усувають виявлені перешкоди; строк і рішення щодо індексації визначає Google.
