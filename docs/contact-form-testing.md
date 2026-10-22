# Контактна форма: локальне тестування

Mock Mode перевіряє frontend без backend, API-ключів і платних сервісів. Він не надсилає листи, не робить HTTP-запитів із даними форми, не зберігає їх у localStorage і не виводить у консоль.

## Запуск

У корені проєкту встановіть залежності, якщо вони ще не встановлені:

```sh
npm install
```

Скопіюйте `.env.example` у `.env.local`. Для успішного сценарію залиште:

```dotenv
VITE_CONTACT_MODE=mock
VITE_CONTACT_MOCK_RESULT=success
```

Запустіть:

```sh
npm run dev
```

Відкрийте адресу, яку показує Vite, і перейдіть до `#contact`. Після кожної зміни `.env.local` перезапускайте dev-сервер. У Windows PowerShell, якщо виконання `npm.ps1` заблоковане, використовуйте `npm.cmd` замість `npm` у командах цієї інструкції.

`settings.contact.enabled` і `privacyUrl` змінювати вручну не потрібно: вони обчислюються з public build env; mock працює незалежно від production-конфігурації.

## Успішний сценарій

1. Переконайтеся, що видно `Testovací režim – zprávy se skutečně neodesílají.`
2. Введіть вигадані дані: ім’я `Test klient`, email `contact-test@example.com`, повідомлення `Testovací dotaz ke službě.`
3. Телефон і категорію можна залишити порожніми. Для телефону підійде тестовий формат `+420 777 000 000`.
4. Натисніть `Odeslat zprávu`. Приблизно на секунду з’являться `Odesílání...` і індикатор; поля й кнопка будуть заблоковані.
5. Очікуйте `Formulář byl úspěšně otestován. Zpráva nebyla skutečně odeslána.` Усі поля, включно з темою, очистяться.
6. Почніть заповнювати новий запит: попередній результат зникне, форма повернеться до `idle`.

## Помилка та повторна спроба

Змініть `.env.local` і перезапустіть сервер:

```dotenv
VITE_CONTACT_MODE=mock
VITE_CONTACT_MOCK_RESULT=error
```

Заповніть форму валідними тестовими даними та надішліть. Через секунду з’явиться `Testovací chyba: zpráva nebyla odeslána. Zkuste to znovu.` Дані залишаться у полях, кнопка знову стане доступною. Повторне натискання виконає нову спробу. Поки задано `error`, кожна спроба навмисно завершується помилкою. Для успіху поверніть `success` і перезапустіть dev-сервер.

## Валідація, тема та доступність

- Надішліть порожню форму: помилки чеською з’являться під ім’ям, email і повідомленням; фокус перейде до першого некоректного поля.
- Перевірте email `abc`, телефон `abc` або `123`, ім’я з одного символу, порожнє повідомлення.
- Ім’я має містити 2–100 символів, повідомлення — 2–2000, email — коректний формат і до 254 символів. Пробіли по краях видаляються.
- Телефон необов’язковий; заповнений має містити 7–15 цифр, до 30 символів загалом. Дозволені початковий `+`, пробіли, дужки, крапки й дефіси.
- Помилка вже перевіреного поля зникає після виправлення. Обмеження перевіряє спільна Zod-схема, а не окремі правила JSX.
- У блоці подарункових сертифікатів натисніть `Zeptat se na poukaz`: у формі автоматично вибереться `Dárkový poukaz`.
- Перевірте послідовність Tab: ім’я → email → телефон → категорія → повідомлення → кнопка. Enter на кнопці надсилає форму. Результат оголошується через `aria-live="polite"`.
- Перевірте вузький екран: поля не повинні виходити за його межі. При зменшенні анімацій у системі обертання індикатора вимикається.

## Автоматизовані перевірки

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Окремий запуск тестів контактної форми:

```sh
npm run test:contact
```

Тести використовують наявні Node Test Runner, Vite та Playwright. Якщо Chromium для Playwright ще не встановлений, один раз виконайте `npx playwright install chromium`. Додатковий тестовий фреймворк не потрібен.

Контактні тести самі запускають ізольовані dev-сервери для `success` і `error`, ігнорують ваш `.env.local` та закривають браузер і сервери після виконання. Вони перевіряють схему й граничні значення, відображення полів, виправлення помилок, затримку, блокування повторних надсилань, очищення після успіху, збереження після помилки, повторну спробу, зв’язок GiftCards → App → ContactForm, клавіатуру, ширини 320/390/768/1280 px та відсутність HTTP-надсилань і браузерних помилок.

Окрема production-збірка навмисно створюється з `VITE_CONTACT_MODE=mock` у `node_modules/.tmp/contact-production`: тест відкриває її у браузері та перевіряє, що mock не активний, тестового повідомлення немає, кнопка вимкнена, а примусова подія submit не показує успіх. Основну папку `dist` цей тест не змінює. Знімки форми створюються в `reports/qa/contact-form/`.

Друга ізольована production-збірка у `node_modules/.tmp/contact-real-production` перевіряє налаштований real mode. Playwright повністю перехоплює Turnstile JavaScript та `/api/contact`: перевіряються токен, помилка API зі збереженням введення, нове підтвердження, успіх та очищення полів. Справжні Turnstile-запити та листи не надсилаються.

`node --test tests/contact-api.test.mjs` окремо перевіряє Pages Function зі штучними відповідями `fetch`: відсутню конфігурацію, Origin, Content-Type, JSON, схему, honeypot, ліміти байтів, hostname/action Turnstile, помилки провайдерів та успіх тільки після Resend id. У цьому наборі немає мережевих звернень до провайдерів.

## Файли

| Файл | Призначення |
| --- | --- |
| `src/components/sections/ContactForm.tsx` | Поля, валідація, стани `idle/sending/success/error`, фокус і результат |
| `src/components/sections/Contact.tsx` | Розміщення форми у секції контактів; без змін |
| `src/lib/contact.ts` | `submitContact(data, verification)`, DEV mock та real POST із таймаутом |
| `src/lib/turnstile.ts` | Умовне завантаження Turnstile, без стороннього скрипта у вимкненому/mock режимі |
| `src/lib/contactSchema.ts` | Спільна Zod-схема, телефон, доступні категорії |
| `src/data/content.ts` | Чеські підписи й повідомлення |
| `src/data/categories.ts`, `src/data/services.ts` | Джерело категорій із опублікованими послугами; без змін |
| `src/data/settings.ts` | Явна активація production з public env, sitekey та затвердженою privacy URL |
| `src/pages/HomePage.tsx`, `src/components/sections/GiftCards.tsx` | Існуюче передавання теми; без змін у межах цього завдання |
| `src/components/sections/ContactForm.css` | Стилі полів, результату й індикатора |
| `.env.example` | Приклад локальних налаштувань |
| `tests/contact.test.mjs`, `tests/contact-api.test.mjs`, `tests/site.test.mjs` | Браузерні, API, schema та регресійні тести |
| `functions/api/contact.ts` | Вимкнений до повного налаштування серверний адаптер Turnstile + Resend |
| `public/_headers` | Security headers статичних відповідей; API додає власні headers |

## Production: підготовлена інтеграція, надсилання заблоковане

За замовчуванням форма недоступна. Mock залишається можливим лише у development і завжди показує тестове повідомлення. Справжні домен, mail provider та юридичні відомості власниці ще не погоджені, тому **контактна форма залишається production blocker**. Наявність реалізації й mocked тестів не підтверджує реальну доставку.

Для browser build потрібні `VITE_CONTACT_MODE=production`, публічний `VITE_TURNSTILE_SITE_KEY` та `VITE_CONTACT_PRIVACY_URL` із затвердженим доступним документом. Потрібна нова production-збірка. `VITE_SITE_URL` задає окремо затверджений canonical origin. Усі `VITE_*` відкриті користувачам; приватні ключі в них заборонені.

Cloudflare Pages runtime налаштування:

| Змінна | Призначення |
| --- | --- |
| `CONTACT_ENABLED` | `true` лише після виконання наведених нижче умов; інакше 503 |
| `CONTACT_ALLOWED_ORIGIN` | Єдиний дозволений production `https://` origin, без slash/path/query |
| `CONTACT_PRIVACY_URL` | Та сама затверджена privacy URL, відносна `/path` або HTTPS |
| `CONTACT_FROM` | Проста email-адреса на підтвердженому домені відправника Resend |
| `CONTACT_TO` | Одержувач, підтверджений власницею |
| `RESEND_API_KEY` | Секрет Cloudflare, ключ із мінімально необхідними правами надсилання |
| `TURNSTILE_SECRET_KEY` | Секрет Cloudflare для server-side Siteverify |

Ключі зберігати як secrets у Dashboard; для локального Pages runtime — у проігнорованому `.dev.vars`. `.env.local`, `.env.*`, `.dev.vars` та `.dev.vars.*` захищені `.gitignore`. Приклади містять порожні значення.

Перед активацією:

1. Погодити оператора/контролера, правову підставу, строки зберігання, одержувачів/постачальників і текст privacy. Не використовувати вигадану `/privacy` сторінку.
2. Підтвердити sender domain у Resend, одержувача та відповідні умови обробки даних провайдером. Налаштувати production Turnstile widget лише на погодженому hostname; action `contact` перевіряється сервером.
3. Налаштувати Cloudflare WAF rate limiting для `POST /api/contact` на погодженому домені. Поріг обрати з урахуванням доступних можливостей плану та нормальної активності; перевірити блокування серією тестових запитів. Вбудованого глобального лічильника тут немає. Turnstile, одноразові токени, honeypot та обмеження тіла — додаткові шари, а не підтвердження діючого WAF-ліміту.
4. Залишити реальне надсилання вимкненим на preview. Backend приймає тільки точний Origin, що додатково забороняє використання production API з preview hostname.
5. Після окремого дозволу власниці перевірити одне реальне надсилання, одержання листа, Reply-To, помилки провайдера та безпечну повторну спробу. До такого тесту реальна доставка не підтверджена.

Function обмежує JSON до 16 KiB фактичних байтів і читання до 5 секунд, перевіряє поля спільною схемою, відхиляє honeypot, звіряє server-side Turnstile `hostname`/`action` та надсилає лише plain text. Зовнішні запити мають timeout 5 секунд, browser POST — 20 секунд. Кожне нове повідомлення отримує випадковий UUID `submissionId`: він зберігається в пам'яті форми для повторної спроби з тими самими нормалізованими даними та передається як Resend `Idempotency-Key`. Новий Turnstile-токен не змінює цей ключ. Зміна даних або успіх очищає попередній ідентифікатор. Це запобігає повторному надсиланню після втрати відповіді в межах гарантій ідемпотентності провайдера; локального постійного сховища немає. Успіх означає прийняття Resend із `id`; це не гарантія доставки до inbox. Function не логує та не зберігає введення, токени чи відповіді з персональними даними. Хостинг і mail provider можуть мати власні журнали та строки зберігання — їх потрібно включити до фактичної політики.

Security headers у `_headers` застосовуються до статичних відповідей; Function встановлює `no-store`, JSON Content-Type, `nosniff`, `DENY`, Referrer-Policy і мінімальну CSP самостійно. Остаточні headers перевіряються на Cloudflare preview, оскільки Vite preview не емулює Pages headers/runtime.

Офіційні джерела: [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email), [Cloudflare WAF rate limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/).
