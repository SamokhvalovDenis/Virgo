# 05. Функціонал, архітектура, Cloudflare, безпека

## Технологічний стек

- React + TypeScript + Vite
- Tailwind CSS 4 для стилів
- `lucide-react` для іконок
- `react-hook-form` + `zod` (опційно для форми; Zod на сервері обов'язково для перевірки)
- Cloudflare Pages для статичного Frontend
- Cloudflare Pages Functions для `/api/contact`
- Resend або сумісний поштовий провайдер — для доставки листа
- Cloudflare Turnstile — захист від спаму
- Termino — система бронювання
- без БД, без CMS, без React Router (одна сторінка)

## Базова структура

```text
virgo-studio/
├── AGENTS.md
├── README-VIRGO.md
├── docs/
├── references/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── images/
│       └── (фото, які надасть власниця)
├── functions/
│   └── api/
│       └── contact.ts
├── src/
│   ├── components/
│   │   ├── layout/ Header.tsx, Footer.tsx
│   │   ├── ui/ BookingButton.tsx, SectionHeading.tsx
│   │   └── sections/ Hero.tsx, Services.tsx, PriceList.tsx, ...
│   ├── data/
│   │   └── (готові стартові типізовані файли)
│   ├── lib/
│   │   ├── formatPrice.ts
│   │   └── analytics.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts
└── package.json
```

## Важливо про `functions/`

Для Cloudflare Pages Functions папка `functions/` має бути в **корені репозиторію**, поруч із `src/`, а **не всередині** `src/`. Vite збирає лише статичний React; серверну функцію запускає Cloudflare.

Frontend:
```ts
await fetch("/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name, email, phone, serviceId, message, turnstileToken
  }),
});
```

Backend:
1. `POST` only, JSON only, обмеження розміру тіла.
2. Перевірити ім'я, email, довжину повідомлення та Turnstile token.
3. Антиспам/rate limit, мінімум логування персональних даних.
4. Сервер викликає Resend API із `RESEND_API_KEY` (Cloudflare secret).
5. Повертає `200` при прийнятті заявки або безпечну `4xx/5xx` помилку.
6. Не включати секрети або повний текст заявки до browser console / analytics.
7. Якщо лист не відправився, показати помилку та запропонувати альтернативний контакт.

`VITE_*` env vars **публічні для браузера**. `RESEND_API_KEY` у них ніколи не зберігати.

## Email і перевірка домену

Для production потрібно:
- підтвердити домен відправника в Resend (DNS записи, які попросить сервіс);
- використовувати реальну адресу одержувача від власниці;
- перевірити доставку, spam-folder, SPF/DKIM за інструкціями;
- бажано поставити `reply_to` на email із форми, але не підміняти `from` email клієнта;
- окремо погодити автоматичну відповідь клієнту, не включати за замовчуванням.

## Поля форми

| Поле | Вимога | Примітка |
|---|---|---|
| Jméno | required | 2–100 символів |
| E-mail | required | валідна адреса |
| Telefon | optional | тільки якщо справді потрібен |
| Služba | optional | із даних `services.ts`, без ручного дублювання |
| Zpráva | required | до 2000 символів |
| Turnstile token | required після інтеграції | перевірити на сервері |

**Privacy Policy / GDPR**: власниця має надати або затвердити юридичні тексти, підставу й терміни обробки, контакт контролера даних. Не додавати фейковий чекбокс “я згоден”, якщо немає правової необхідності; надати зрозуміле повідомлення про використання даних.

## Termino

Реальне посилання: https://www.termino.eu/r/beauty-studio-litomerice  
Перевірити його перед продакшном. Кнопки `target="_blank"` + `rel="noopener noreferrer"` або перехід у тій же вкладці — узгодити.

Не припускати наявність API, preselect послуг чи embed без перевірки. Наш сайт **не зберігає бронювання**.

## SEO для локального салону

- Чеські `title`, `meta description` із Litoměřice; один `h1`.
- `lang="cs"` в `index.html`.
- Семантичні заголовки, alt реальних фото, структуровані тексти цін.
- Канонічна URL лише після узгодження домену.
- `sitemap.xml` та `robots.txt` (не блокувати публічний сайт).
- `LocalBusiness` або більш вузький доречний `schema.org` тип — **лише з реальною адресою, графіком, телефоном**; не вставляти вигадані дані.
- Google Search Console + (за бажанням) Google Business Profile.
- Cloudflare Web Analytics — кліки на Termino, відправки форми, без персональних даних.
- Vite SPA з однією сторінкою має обмеження порівняно з SSR/SSG для масштабного SEO. Для невеликого лендингу це допустимо; за потреби багатьох сторінок перейти на SSG/SSR пізніше.

## Продуктивність і доступність

- LCP / CLS / INP оптимізувати без надмірного JavaScript.
- WebP/AVIF, правильні розміри зображень, lazy-load нижче першого екрану.
- Нормальні `label` і `focus`; контраст, клавіатура, `aria-expanded` для меню, `aria-pressed` для Ženy/Muži.
- Не зберігати користувацькі заявки в LocalStorage.
- Політика кукі/аналітики має відповідати реальному набору інструментів (юридичний огляд до релізу).

## Деплой на Cloudflare Pages

Build command: `npm run build`  
Build output directory: `dist`  
Framework preset: `Vite` / `React` якщо доступний.  
Перевірити GitHub integration та змінні середовища.

**Локальне тестування API:** `npm run build`, потім `npx wrangler pages dev dist` для Pages Functions у сумісному режимі. Звичайний `npm run dev` запускає Vite, але не обов'язково Cloudflare Functions.

Документація:
- https://vite.dev/guide/
- https://developers.cloudflare.com/pages/
- https://developers.cloudflare.com/pages/functions/
- https://developers.cloudflare.com/turnstile/
- https://resend.com/docs
