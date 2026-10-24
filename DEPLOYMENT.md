# Virgo Beauty Studio — Cloudflare Workers / Pages

## Поточний production: Cloudflare Workers

Поточна адреса — **https://virgo.beautycz.workers.dev/**. SEO-аудит і перевірки: [docs/seo-audit.md](docs/seo-audit.md). Розділи про Pages нижче описують альтернативну платформу, а не налаштування поточного Worker.

- У підключеному до GitHub Worker `virgo` використовуйте build command **`npm run build`**, deploy command **`npx wrangler deploy`** з кореня репозиторію і конфігурацію **`wrangler.json`**. Публікується **`dist`**, зокрема п'ять HTML-сторінок і `404.html`. Не змінюйте ім'я Worker або hostname.
- `assets.html_handling: "drop-trailing-slash"` зіставляє `/sluzby/masaze` з `dist/sluzby/masaze.html`; `assets.not_found_handling: "404-page"` повертає невідомим адресам справжній HTTP 404. Приберіть у налаштуваннях збірки альтернативну конфігурацію SPA fallback або CLI-параметри, що перекривають цей файл. [Офіційна конфігурація SSG для Workers](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).
- `VITE_SITE_URL` необов'язкова: у коді вже задано поточний production origin. Якщо змінна задана в Cloudflare Build variables, вона має дорівнювати `https://virgo.beautycz.workers.dev`. Canonical, `og:url`, robots і sitemap генеруються узгоджено під час build; deploy готового старого `dist` не застосує виправлення.
- Контактна форма надсилає дані прямо до Web3Forms із браузера. Старий Pages endpoint видалено; Workers runtime API та серверні secrets не потрібні.
- Після deployment перевірте зовнішні відповіді всіх п'яти URL, `/robots.txt`, `/sitemap.xml` і `/sluzby/neexistuje`. Локальний preview перевіряє файли, але не доводить стан Dashboard/WAF/CDN. Не додавайте `/* /index.html 200`.

Ця інструкція готує публікацію. Commit, push, створення Pages-проєкту, зміни DNS та реальний deploy у межах аудиту не виконуються.

## Перед публікацією

- Перегляньте `PRE_LAUNCH_REPORT.md`, усі локальні зміни та їхній diff. У робочій копії є зміни, створені до цього аудиту; не скидайте їх.
- Власниця має затвердити основний домен і фактичні контактні дані, години роботи та описи процедур, позначені внутрішнім `needsApproval`.
- Контактна форма використовує Web3Forms і безкоштовну hCaptcha. Увімкніть hCaptcha / Block Spam у кабінеті сервісу; фактичну доставку та доступність workers.dev перевірте після самостійного розгортання за [інструкцією](docs/contact-form-testing.md).
- Уточніть контролера персональних даних, реквізити оператора, строки зберігання, постачальників і порядок запитів користувачів за `docs/reviews-privacy.md` та звітом. Юридичні дані й публічна privacy-сторінка не вигадуються.

## GitHub і збірка

1. Після окремої команди власника підготуйте commit у `https://github.com/SamokhvalovDenis/Virgo`. Перед push перевірте `git status`, diff і `.gitignore`. Не додавайте `.env.local`, `.dev.vars`, ключі або документи зі згодами клієнтів.
2. Використовуйте підтримувану версію Node.js, сумісну з Vite 8 (Node 22.12+; для відтворення можна обрати Node 22 LTS). Зафіксуйте ту саму версію в локальному середовищі та Pages.
3. Виконайте `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` і потрібні браузерні перевірки. У PowerShell можна використовувати `npm.cmd`.
4. `npm run build` виконує TypeScript, клієнтську Vite-збірку та build-time React prerender. Вихідна папка — **`dist`**. Тимчасовий серверний модуль розміщується у `node_modules/.cache/virgo-prerender` і не деплоїться. Додатковий SSR-сервер на Cloudflare не потрібен.

HTML-контент і метадані доступні до JavaScript для `/`, `/sluzby/masaze`, `/sluzby/depilace`, `/sluzby/trvale-odstraneni-chloupku` та `/sluzby/oboci-a-rasy`. React потім гідратує ці сторінки. Збірка також генерує `404.html` з `noindex, follow`.

## Створення Pages-проєкту

У Cloudflare Dashboard відкрийте **Workers & Pages**, створіть **Pages**-проєкт із Git integration, підключіть GitHub і виберіть репозиторій та погоджену production-гілку. Надалі push у production-гілку може автоматично запускати публікацію — налаштуйте branch controls до першого push.

Встановіть:

| Налаштування | Значення |
|---|---|
| Root directory | корінь репозиторію, де знаходиться `package.json` |
| Framework preset | None / Vite, з явними параметрами нижче |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | одна погоджена сумісна версія локально і в Cloudflare |

Контактна форма не потребує Pages Functions; достатньо статичного `dist`.

## Змінні середовища

Публічні `VITE_*` вбудовуються під час build. Потрібні origin і Web3Forms access key вже задано в коді, тому чиста production-збірка не залежить від `.env.local`. Необов'язкові перевизначення: `VITE_SITE_URL`, `VITE_WEB3FORMS_ACCESS_KEY`, `VITE_CONTACT_PRIVACY_URL`. Після їх зміни перебудуйте сайт.

`VITE_CONTACT_MODE=production` використовує справжній API; `mock` діє лише в development і не вмикається у production build. `disabled` явно вимикає форму — приберіть старе значення в Cloudflare Build variables. `VITE_CONTACT_MOCK_RESULT=success|error` потрібна лише для development mock. Серверні CONTACT_*, RESEND_API_KEY та TURNSTILE_SECRET_KEY більше не використовуються.

Безкоштовна hCaptcha використовує спільний ключ Web3Forms із коду. Увімкніть hCaptcha / Block Spam у кабінеті Web3Forms для обов'язкової перевірки токена на API. Деталі конфігурації та live-тесту: [docs/contact-form-testing.md](docs/contact-form-testing.md).

## Маршрути і preview

Статичні сторінки послуг записуються як `dist/sluzby/slug.html`. Pages обслуговує їх за чинними URL без розширення; чотири точкові redirects прибирають завершальний `/`. Wildcard rewrite на `index.html` не потрібний: він приховав би справжні 404. Наявність top-level `404.html` вимикає стандартний SPA fallback Pages. [Поведінка статичних маршрутів і 404](https://developers.cloudflare.com/pages/configuration/serving-pages/).

`_redirects` та `_headers` застосовуються до статичних відповідей. Окремого контактного API немає.

Локально `npm run preview` запускає статичний перегляд на `http://127.0.0.1:4173`. Він відтворює extensionless HTML, redirects і HTTP 404; **не виконує Pages Functions і не емулює всі Cloudflare headers**. Старий стандартний Vite preview використовував SPA fallback і не доводив правильний production HTTP-статус. Web3Forms і hCaptcha перехоплюються в автоматичних тестах; реальну доставку перевіряйте вручну з production hostname після розгортання.

Перед production перевірте preview deployment: усі п'ять маршрутів при прямому введенні і перезавантаженні, невідомий `/sluzby/neexistuje` з HTTP 404, картинки/шрифти, усі Termino-посилання, меню, прайс, галерею, дев'ять відгуків і стани контактної форми. Для мобільних перевірок: `npm run test:readiness:browser`; для prerender/SEO: `npm run test:seo:browser`. Cloudflare автоматично додає `X-Robots-Tag: noindex` до preview URL; перевірте це на реальній preview-відповіді.

## Домен, HTTPS та індексація

1. Власниця обирає домен і основний варіант із `www` або без нього. Значення в коді не вигадується.
2. У **Pages → Custom domains → Set up a domain** додайте погоджений hostname. Для apex-домену потрібна Cloudflare zone і належні nameservers; для субдомену виконайте DNS-інструкції Pages. Дочекайтесь активного домену й сертифіката. [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
3. Увімкніть zone-level **Always Use HTTPS** та перевірте редирект HTTP → HTTPS. Налаштуйте постійний redirect альтернативного `www`/apex-hostname на основний зі збереженням шляху і query. За потреби окремо налаштуйте redirect production `pages.dev` hostname; доменні redirects не записуйте як недійсні правила `_redirects`. [Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/), [Pages domain redirect](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/).
4. Поточний origin `https://virgo.beautycz.workers.dev` уже заданий у коді. Необов'язкове `VITE_SITE_URL` має збігатися з ним; після зміни build-змінних перебудуйте сайт. Canonical, `og:url`, social images, robots і sitemap генеруються для цього origin; відсутність production origin зупиняє build.
5. Переконайтеся, що кожна реальна сторінка має власний canonical, а `/sitemap.xml` містить рівно п'ять реальних URL без вигаданого `lastmod`. `/robots.txt` має дозволяти індексацію і посилатися на цей sitemap. Production-відповіді не повинні мати випадкового `noindex`.
6. Перевірте JSON-LD у [Rich Results Test](https://search.google.com/test/rich-results) і [Schema Markup Validator](https://validator.schema.org/); потім підтвердьте сайт і sitemap у Google Search Console та використайте URL Inspection для сервісних сторінок. Під час локального аудиту зовнішні валідатори не були виконані: у середовищі немає доступного керованого браузера. Локальна перевірка JSON, полів і відсутності self-serving review markup виконана; вона не замінює ці сервіси.

JSON-LD використовує `BeautySalon`, підтип `LocalBusiness`, з наявними даними студії. Власні відгуки й `AggregateRating` до schema не додаються. [Google: LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business), [обмеження self-serving reviews](https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful).

## Перевірка після deployment і rollback

Зіставте production HTML із preview, перевірте мережеві помилки та security headers, HTTPS, HTTP-статуси, canonical/robots/sitemap, соціальні посилання, Termino та всі основні сценарії на телефоні. Виміряйте Lighthouse на production build; лабораторний TBT не є фактичним INP. Польові Core Web Vitals потребують даних реальних користувачів.

У DevTools Network перевірте `Content-Encoding` для HTML, CSS і JavaScript. Фінальне локальне порівняння зі стисненням дало mobile Performance 90, але LCP 3.57 s ще перевищує ціль 2.5 s; без стиснення mobile home має лише 69. Cloudflare підтримує [стиснення текстових ресурсів](https://developers.cloudflare.com/speed/optimization/content/compression/), однак фактичні compression rules/відповіді потрібно перевірити. Не порівнюйте gzip-вимірювання з raw baseline як однакові умови. Після запуску повторіть performance audit через справжній CDN і допрацюйте LCP.

При проблемах відкрийте **Pages → Deployments**, виберіть попередній успішний **production deployment** і **Rollback to this deployment**. Preview не є rollback target. Окремо перевірте актуальність secrets, DNS і provider settings: повернення HTML не замінює контроль зовнішньої конфігурації. [Офіційний rollback workflow](https://developers.cloudflare.com/pages/configuration/rollbacks/).

Зміни в Git, Dashboard, DNS, реальні повідомлення та публікація виконуються лише після окремої команди власника.
