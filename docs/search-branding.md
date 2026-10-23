# Назва Virgo та favicon у Google Search

Перевірено 23 жовтня 2026 року. Зміни підготовлені в репозиторії та `dist/`; розгортання на Cloudflare в межах цієї роботи не виконувалося.

## Що було на опублікованому сайті

- На всіх п'яти сторінках були пререндерені чеські title/description, canonical та Open Graph. `og:site_name` уже мав правильне значення `Beauty Studio Virgo`.
- Головна містила один `BeautySalon`, але не містила `WebSite`. Назва бізнесу в `BeautySalon` не замінює окремий сигнал назви сайту через `WebSite`.
- HTML посилався на `/favicon.svg`: це була намальована літера V, а не наявний логотип салону. Сам SVG повертав HTTP 200; `/favicon.ico` та `/favicon.png` повертали HTTP 404 з HTML.
- `robots.txt` дозволяв сканування. У перевіреному head не було назви Cloudflare. Відсутність `WebSite` та непридатний бренду favicon є виправленими технічними недоліками; точну причину вибору Google назви «Cloudflare» або глобуса без даних Google встановити неможливо.

Знімок HTTP-відповідей до змін: [search-branding-live-before.json](../reports/seo/search-branding-live-before.json).

## Що виправлено

Іконки створено звичайним масштабуванням справжнього `public/images/logo.png` зі збереженням усього зображення та пропорцій. Логотип не перемальовували; оригінальний файл не змінено. Додано білий квадратний фон для видимості на світлих і темних поверхнях.

- `/favicon.png`: 96×96 px.
- `/favicon.ico`: PNG-зображення 16, 32, 48, 96 та 192 px в одному ICO.
- `/apple-touch-icon.png`: 180×180 px.

Посилання на іконки містяться безпосередньо в `index.html` і потрапляють в усі пререндерені сторінки. Старий SVG з літерою V видалено. Відтворення іконок: `npm.cmd run favicon:generate` (потрібен установлений Chromium для Playwright). Звичайний build копіює готові файли з `public/` і не потребує запуску браузера для генерації іконок.

Спільний генератор SEO додає на головну рівно один окремий JSON-LD блок:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://virgo.beautycz.workers.dev/#website",
  "name": "Beauty Studio Virgo",
  "alternateName": "Virgo Beauty Studio",
  "url": "https://virgo.beautycz.workers.dev/"
}
```

Існуючий `BeautySalon` збережений. На сторінках послуг та 404 блоків `WebSite` немає. Конфліктуючих вузлів `WebSite`, зокрема вкладених у JSON-LD, у production HTML не виявлено. `og:site_name` збережено й перевірено на всіх п'яти сторінках; `og:title`, `og:description` та `og:url` узгоджені з метаданими відповідної сторінки.

## Перевірки

- `npm.cmd run build` — успішно: п'ять сторінок та 404 пререндерені.
- `npm.cmd run lint` — успішно.
- `npm.cmd test` — 47/47 успішних тестів. Vite також вивів попередження про зайнятий локальний WebSocket-порт 24678; тести завершилися з кодом 0.
- `node tests/seo.browser.mjs` — успішно: HTML без JavaScript, точні поля й єдиний `WebSite`, відсутність дублювання після гідратації, Open Graph, прямі HTTP 200 для іконок, MIME, розміри PNG/ICO, декодування зображень, canonical, robots, sitemap і 404.
- Основний `<main>`, title і description всіх п'яти сторінок побайтово/точно збігаються з опублікованою версією до змін. CSS, ціни, дані сторінок, контактну форму, домен і конфігурацію Cloudflare не редагували.

Результати: [production.json](../reports/seo/production.json), [search-branding-preservation.json](../reports/seo/search-branding-preservation.json). HTTP 200 для нових іконок перевірено на локальному сервері готової production-збірки, не на публічному хості, де ще працює попередня версія.

## Як перевірити після розгортання

1. Розгорнути готову збірку звичайним процесом проєкту без зміни домену або Cloudflare config.
2. Відкрити [favicon.png](https://virgo.beautycz.workers.dev/favicon.png) та [favicon.ico](https://virgo.beautycz.workers.dev/favicon.ico). У Network мають бути HTTP 200 та відповідно `image/png` і MIME іконки, а не HTML сторінки помилки. PNG має бути квадратним, 96×96 px, з логотипом Virgo.
3. Через «Переглянути вихідний код» головної перевірити `rel="icon"`, `og:site_name` і рівно один `"@type":"WebSite"` з наведеними полями. Перевіряти початковий HTML, не лише вкладку Elements після виконання JavaScript. На решті чотирьох сторінок перевірити власні чеські title/description і canonical.
4. За наявності доступу до Google Search Console виконати URL Inspection головної → Test live URL, перевірити HTML і доступність іконок та запросити повторну індексацію головної.

Назву та іконку в результатах обирає Google. Зміни дають узгоджені брендові сигнали, але не гарантують заміну «Cloudflare» або глобуса. Повторне сканування й обробка можуть тривати від кількох днів до кількох тижнів. Див. офіційні настанови Google щодо [назви сайту](https://developers.google.com/search/docs/appearance/site-names) та [favicon](https://developers.google.com/search/docs/appearance/favicon-in-search). Назва домену, яка показується окремо в результаті, залишиться поточним хостом; `studiovirgo.cz` на наданому макеті не підставлявся.
