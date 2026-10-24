# Web3Forms: перевірка інтеграції, 24.10.2026

## Змінені файли

- `src/components/sections/ContactForm.tsx`, `src/lib/contact.ts`, `src/lib/contactSchema.ts`, `src/data/settings.ts`; додано `src/lib/hcaptcha.ts`.
- `.env.example`, `tsconfig.json`, `README.md`, `DEPLOYMENT.md`, `docs/contact-form-testing.md`.
- `tests/contact-api.test.mjs`, `tests/contact.test.mjs`, `tests/site.test.mjs`, `tests/reviews.browser.mjs`.
- Видалено `functions/api/contact.ts`, `src/lib/turnstile.ts`, `tsconfig.functions.json`, `public/_routes.json`.
- Додано цей звіт, `web3forms-production-success.png` та окремі screenshots/JSON адаптивної перевірки в `reports/qa/web3forms-readiness/`. Попередні згенеровані звіти відновлено, щоб не включати їх випадкові відмінності.

## Результати

- `npm run typecheck`, `npm run lint`, `npm test`: успішно; 45 тестів, зокрема 16 тестів клієнта/форми.
- `npm run build`: успішно; 5 prerendered сторінок та `404.html`. Production ігнорує mock, ключ і endpoint перевірено у виконуваному production bundle без env-файлів.
- `node tests/seo.browser.mjs`: усі 5 сторінок без JavaScript, hydration, metadata, canonical, robots/sitemap, redirects, 404, favicon — успішно.
- `node tests/readiness.browser.mjs reports/qa/web3forms-readiness`: 50 route/viewport сценаріїв, меню, клавіатура, overflow та короткий мобільний viewport — успішно.
- `node tests/prices.browser.mjs`: 40 category/viewport сценаріїв, обидві аудиторії — успішно.
- `node tests/services.browser.mjs`: 10 viewport сценаріїв, 4 сторінки послуг, booking clicks, keyboard, hover, reduced motion — успішно.
- `node tests/contact-layout.browser.mjs`: контактні дані, посилання, layout і focus на 6 ширинах — успішно.
- `node tests/reviews.browser.mjs`: усі 9 відгуків на 13 ширинах, повні тексти, рейтинги, клавіатура, swipe, resize, reduced motion — успішно.

Тест відгуків спочатку очікував однаковий line-height цитати та About (29.6px / 26.4px). Цю саму помилку відтворено на чистій збірці початкового HEAD в ізольованій тимчасовій папці. Оновлено тільки очікування тесту до існуючого дизайну; CSS і контент не змінювалися. Початкові timeout двох browser suites під час паралельного запуску не повторилися при повторній перевірці.

Перевірки Web3Forms покривають HTTP 2xx + boolean `success: true`, помилки 400/403/429/503, false success, неправильний JSON, offline/timeout, усі поля і Reply-To, Zod, honeypot, hCaptcha expiry/error/retry, блокування повторних submit, збереження всіх полів при помилці та очищення після успіху. Web3Forms і hCaptcha перехоплено: автоматичні тести не надсилали справжніх листів. PNG поруч показує production-стан успіху з тестовою captcha.

Live GET `https://virgo.beautycz.workers.dev/` повернув HTTP 200; опублікований HTML містить `#form-availability` і вимкнену кнопку submit. Реальне надсилання з цього домену не перевірено: зміни за вказівкою власника не розгорталися. Блокування workers.dev Web3Forms не підтверджене і не спростоване.

Після самостійного deployment: увімкнути hCaptcha / Block Spam у Web3Forms, прибрати старе `VITE_CONTACT_MODE=disabled` із Cloudflare Build variables, надіслати одну тестову заявку з поточного hostname та перевірити Inbox/Spam і Reply-To. [Докладна інструкція](../../../docs/contact-form-testing.md).
