# Virgo Beauty Studio

Сайт студії у Litoměřice: головна, чотири сторінки послуг і 404. React 19, TypeScript strict, Vite 8, Tailwind CSS 4; чеський інтерфейс, локальні шрифти й фотографії, HTML-прайс і запис через Termino.

## Локальний запуск

```sh
npm ci
npm run dev
```

У Windows PowerShell за потреби використовуйте `npm.cmd` замість `npm`.

## Перевірки

```sh
npm run typecheck
npm run lint
npm test
npm run test:browser
npm run test:readiness:browser
npm run test:seo:browser
```

`npm test` перевіряє контент, прайс, маршрути, SEO, валідацію й контактну форму через локальні mock-сервери без реального надсилання повідомлень. Браузерні тести використовують встановлений Chromium Playwright. `test:browser` один раз збирає production і послідовно перевіряє прайс, галерею, карусель, readiness та SEO. Окремі команди: `test:prices:browser`, `test:about:browser`, `test:reviews:browser`. `test:readiness:browser` перевіряє п'ять маршрутів на десяти ширинах; `test:seo:browser` перевіряє HTML без JavaScript, гідратацію, метадані, redirects, sitemap і HTTP 404.

`npm run test:refactor:browser` — архівна перевірка попереднього рефакторингу: 18 комбінацій маршруту й ширини порівнюються з `reports/refactor/before/`. Після свідомих змін SEO, адаптивних зображень, форми й accessibility рівність старих метаданих, assets та скриншотів не очікується; ця команда не є поточним release gate. Історичний еталон збережено без перезапису. Для архівного порівняння є маскування нестабільно намальованих зображень; новий еталон створюється тільки явно через `--record` після окремого перегляду.

Поточні результати й скриншоти перевірок зберігаються у `reports/qa/`; історичні аудити та джерела — у `reports/`. Браузерні набори рекомендовано запускати послідовно, як у `test:browser`.

## Структура

- `src/app/App.tsx` — оболонка застосунку та вибір сторінки за URL.
- `src/pages/` — композиція головної, сторінка послуг і 404.
- `src/components/layout/` — Header, Footer та їхні стилі.
- `src/components/sections/` — секції та стилі секцій.
- `src/components/ui/` — спільні елементи, галерея й карусель з власними стилями.
- `src/data/` — контент, послуги, ціни, контакти, ресурси та налаштування; типи поруч із даними.
- `src/lib/` — валідація, клієнт форми, перетворення прайсу й opt-in аналітика.
- `src/lib/seo.ts`, `src/entry-server.tsx`, `scripts/build.mjs` — спільні метадані й build-time prerender.
- `src/styles/` — CSS-вхід, тема, базові й спільні правила, локальні шрифти та адаптивність.
- `public/images/` — вибрані ресурси й збережені оригінали.
- `src/lib/contact.ts`, `src/lib/hcaptcha.ts` — пряме клієнтське надсилання до Web3Forms і безкоштовна hCaptcha.
- `tests/` — перевірки; `tests/helpers/preview.mjs` керує локальним production preview.
- `reports/virgo-images.json` — збережений інвентар джерел; [історична інструкція збору](docs/image-extraction.md).
- `scripts/optimize-images.mjs` — WebP-розміри зі збережених реальних фото; повторна генерація: `npm run images:optimize` (потрібний встановлений Chromium Playwright). Оригінали зберігаються.
- `scripts/optimize-fonts.mjs` — менші локальні Inter WOFF2 зі збереженням усієї вагової осі; готові файли й OFL licenses у `public/fonts/`. Для повторної генерації потрібен ізольований `subset-font@2.9.0` у `node_modules/.cache/virgo-fonts` (див. `reports/prelaunch/README.md`). Звичайний build цього інструмента не потребує.

## Збірка й Cloudflare

`npm run build` створює `dist/` із готовим HTML для головної, чотирьох сторінок послуг і справжньою `404.html`. React гідратує контент; prerender не потребує runtime SSR-сервера або нового фреймворку. Поточний production — `https://virgo.beautycz.workers.dev/`; `wrangler.json` задає Workers Static Assets з `dist`, URL без завершального `/` та `404-page` замість SPA fallback. `npm run preview` запускає локальний статичний перегляд із extensionless HTML та HTTP 404; Cloudflare API цей перегляд не виконує. `public/_redirects` містить лише точкові redirects завершального `/`. Контактна форма працює через Web3Forms із браузера; серверний endpoint не потрібен. Докладний порядок публікації — [DEPLOYMENT.md](DEPLOYMENT.md), результати SEO-аудиту — [docs/seo-audit.md](docs/seo-audit.md).

Форма у production використовує Web3Forms із наданим публічним ключем. Чиста збірка має потрібні значення в коді; VITE-змінні можна перевизначити під час build. Приберіть старий `VITE_CONTACT_MODE=disabled` із Cloudflare Build variables. Безкоштовна hCaptcha потребує ввімкнення Block Spam у кабінеті Web3Forms. Для локального mock задайте `.env.local`: `VITE_CONTACT_MODE=mock`; mock діє лише у development. Детальні перевірки та обмеження live-тесту — [інструкція форми](docs/contact-form-testing.md).

## Дані та подальші інтеграції

Прайс містить 137 рядків / 198 цінових значень; відгуки — 9 наданих записів із паперової книги студії без даних авторів і вигаданих дат. Для завершення політики захисту даних потрібна інформація з [переліку для власниці](docs/reviews-privacy.md). FAQ залишається прихованим до отримання відповідей. Тексти, твердження з позначками `needsApproval`, актуальність Pluxee та умови сертифікатів потребують перевірки власниці. Кожен реальний маршрут має власні title/description, OG і Twitter metadata у початковому HTML. `BeautySalon` JSON-LD містить лише наявні дані без review/aggregate rating.

Поточний production origin уже заданий у `src/data/site.ts`; `VITE_SITE_URL` може явно перевизначити його під час build. Усі п'ять сторінок отримують власні canonical навіть без цієї змінної; з того самого origin генеруються robots і sitemap.

Докладніше: [дані](src/data/README.md), [форма](docs/contact-form-testing.md), [звіт рефакторингу](docs/refactoring-report.md).
