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
- `functions/api/contact.ts` — серверна валідація, Turnstile та Resend; надсилання вимкнене до налаштування.
- `tests/` — перевірки; `tests/helpers/preview.mjs` керує локальним production preview.
- `reports/virgo-images.json` — збережений інвентар джерел; [історична інструкція збору](docs/image-extraction.md).
- `scripts/optimize-images.mjs` — WebP-розміри зі збережених реальних фото; повторна генерація: `npm run images:optimize` (потрібний встановлений Chromium Playwright). Оригінали зберігаються.
- `scripts/optimize-fonts.mjs` — менші локальні Inter WOFF2 зі збереженням усієї вагової осі; готові файли й OFL licenses у `public/fonts/`. Для повторної генерації потрібен ізольований `subset-font@2.9.0` у `node_modules/.cache/virgo-fonts` (див. `reports/prelaunch/README.md`). Звичайний build цього інструмента не потребує.

## Збірка й Cloudflare

`npm run build` створює `dist/` із готовим HTML для головної, чотирьох сторінок послуг і справжньою `404.html`. React гідратує контент; prerender не потребує runtime SSR-сервера або нового фреймворку. `npm run preview` запускає локальний статичний перегляд із extensionless HTML та HTTP 404; Pages Functions цей перегляд не виконує. Cloudflare Pages: build `npm run build`, output `dist`, Functions у кореневій папці `functions/`. `public/_redirects` містить лише точкові redirects завершального `/`; wildcard SPA rewrite вилучений. `public/_routes.json` залишає Functions тільки на `/api/*`. Докладний порядок публікації, змінних, домену й rollback — [DEPLOYMENT.md](DEPLOYMENT.md).

Форма у production вимкнена. Без повної конфігурації Functions повертає `503 CONTACT_NOT_CONFIGURED` для POST і `405` для інших методів. Реальне надсилання потребує погодженої privacy-інформації, Turnstile, Resend, серверних secrets та окремо дозволеного тесту доставки. Для локального mock скопіюйте `.env.example` у `.env.local`; mock працює лише у development. Локальні env-файли й Cloudflare secrets виключені з Git.

## Дані та подальші інтеграції

Прайс містить 137 рядків / 198 цінових значень; відгуки — 9 наданих записів із паперової книги студії без даних авторів і вигаданих дат. Для завершення політики захисту даних потрібна інформація з [переліку для власниці](docs/reviews-privacy.md). FAQ залишається прихованим до отримання відповідей. Тексти, твердження з позначками `needsApproval`, актуальність Pluxee та умови сертифікатів потребують перевірки власниці. Кожен реальний маршрут має власні title/description, OG і Twitter metadata у початковому HTML. `BeautySalon` JSON-LD містить лише наявні дані без review/aggregate rating. Після вибору домену встановіть публічну build-змінну `VITE_SITE_URL` і перебудуйте: canonical, абсолютні social URLs та sitemap п'яти сторінок генеруються тільки для погодженого HTTPS origin. До того build явно попереджає про відсутність цих URL.

Докладніше: [дані](src/data/README.md), [форма](docs/contact-form-testing.md), [звіт рефакторингу](docs/refactoring-report.md).
