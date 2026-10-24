# Контактна форма: Web3Forms

Форма надсилає JSON безпосередньо з браузера на `https://api.web3forms.com/submit`. Успіх — лише HTTP 2xx та `success: true`. Старий `/api/contact`, Resend і Turnstile видалено.

## Vite / Cloudflare Workers

`VITE_*` вбудовуються під час `npm run build`, включно з prerender. Worker runtime variables не змінюють готовий `dist`. `.env.local` і `.env.production` не комітяться. Після зміни build variables потрібна нова збірка.

- `VITE_WEB3FORMS_ACCESS_KEY`: необов'язкове перевизначення; наданий публічний ключ уже є в `src/data/settings.ts`. Чиста Cloudflare-збірка не залежить від локальних env-файлів. Порожнє перевизначення вимикає форму.
- `VITE_CONTACT_MODE`: `production` за замовчуванням. `mock` працює лише у development; production build із `mock` використовує реальний API. `disabled` явно вимикає форму: приберіть старе значення `disabled` у Cloudflare Build variables або задайте `production`.
- `VITE_CONTACT_MOCK_RESULT`: `success` / `error`, лише development mock.
- `VITE_CONTACT_PRIVACY_URL`: необов'язкова адреса наявної погодженої політики.
- `VITE_SITE_URL`: поточний origin збережено — `https://virgo.beautycz.workers.dev`.

Передаються ім'я, email, телефон, ID та чеська назва послуги, повідомлення, `replyto` з email відвідувача, тема «Nová zpráva z webu Beauty Studio Virgo», ключ, `h-captcha-response` та `botcheck: false`. Заповнений honeypot `website` блокує запит. Zod-валідацію полів і чеські повідомлення збережено.

## Безкоштовна hCaptcha

Використовується спільний безкоштовний site key Web3Forms `50b2fe65-b00b-4b9e-ad62-3ba471098be2`, чеська мова, compact-розмір і вимкнена reCAPTCHA-сумісність. Власні платні ключі не потрібні.

**Увімкніть hCaptcha / Block Spam у налаштуваннях цієї форми в кабінеті Web3Forms**, щоб API обов'язково перевіряв токен. Цього налаштування акаунта з репозиторію не змінювали. Токен очищається після кожної спроби та при expiry/error; є повторне завантаження скрипта. Повторні submit під час запиту блокуються ref і disabled-станами. Web3Forms не гарантує idempotency після timeout: перед ручним повтором перевірте скриньку.

## Тести

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:contact:layout`.

`tests/contact-api.test.mjs` перевіряє payload, Reply-To, всі теми, HTTP-помилки, false success, JSON, мережеві помилки, timeout, Zod, captcha та honeypot. `tests/contact.test.mjs` перевіряє mock і production bundle з перехопленими Web3Forms/hCaptcha: loading/success/error, повторні submit, збереження всіх полів при помилках, очищення після успіху, відновлення captcha та адаптивність. Регресійні тести не надсилають справжніх листів.

Для локального mock задайте у `.env.local` `VITE_CONTACT_MODE=mock`, `VITE_CONTACT_MOCK_RESULT=success` або `error` і запустіть `npm run dev`.

## Перевірка справжнього листа

Розгортання не виконувалося. 24.10.2026 production URL повертав HTTP 200, але містив `#form-availability` та вимкнену кнопку submit. Поточна опублікована форма не дозволяє перевірити реальне надсилання. Блокування `workers.dev` не підтверджене і не спростоване.

Після самостійного розгортання власником:

1. Увімкніть hCaptcha у Web3Forms і перевірте Cloudflare Build variables (production, чинний ключ).
2. Відкрийте https://virgo.beautycz.workers.dev/, заповніть усі поля тестовими даними та власним доступним email, пройдіть hCaptcha і надішліть одну заявку.
3. DevTools → Network: POST має йти на `https://api.web3forms.com/submit`, повертати HTTP 2xx та `success: true`. Запитів до `/api/contact` бути не повинно.
4. Перевірте Inbox і Spam скриньки, прив'язаної до ключа, тему «Nová zpráva z webu Beauty Studio Virgo» та всі поля. Натисніть «Відповісти»: адресатом має бути email відвідувача.
5. Якщо API повідомляє про блокування домену, збережіть статус і текст відповіді. Сам HTTP 403 не доводить блокування workers.dev. Не змінюйте домен, не підміняйте Origin/Referer, не проксіюйте запит і не вмикайте платний тариф. Можна уточнити безкоштовну доступність hostname у підтримки Web3Forms.

Офіційні джерела: [API / Reply-To](https://docs.web3forms.com/getting-started/api-reference), [hCaptcha та її активація](https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha), [діагностика](https://docs.web3forms.com/getting-started/troubleshooting).
