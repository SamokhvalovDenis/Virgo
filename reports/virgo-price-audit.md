# Аудит і перенесення прайсів Virgo

Перевірено локальні `reports/virgo-images.html`, `reports/virgo-images.json` та завантажені файли. Дата читання зображень: 15.10.2026; це не дата набуття чинності цін.

## Знайдені джерела

У звіті 167 URL, 165 успішних завантажень. 146 записів зі студійного CDN згруповано у 38 оригінальних зображень за URL до параметрів обрізання/розміру; решта — карти, технічні заглушки, іконки або невдалі завантаження. Візуальний огляд усіх 38 оригіналів виявив 10 прайс-зображень. Для читання взято найбільші завантажені версії. HTML-підписи секцій евристичні: наприклад, загальний прайс позначений у звіті як Vajacial/manjacial, але визначений за вмістом зображення.

| Прайс | Локальний оригінал | Цін у джерелі |
|---|---|---:|
| Péče o obočí a řasy | [virgo-3c06e8b3513e.jpg](../public/images/virgo-original/virgo-3c06e8b3513e.jpg) | 12 |
| Depilace — Ženy / Muži | [virgo-291868b11987.jpg](../public/images/virgo-original/virgo-291868b11987.jpg) | 54 |
| Masáže, maderoterapie a zábaly | [virgo-cc4f36a2336a.jpg](../public/images/virgo-original/virgo-cc4f36a2336a.jpg) | 17 |
| Depilace dámská | [virgo-93e2db7cda04.jpg](../public/images/virgo-original/virgo-93e2db7cda04.jpg) | 12 |
| Depilace pánská | [virgo-8e3a1a28b192.jpg](../public/images/virgo-original/virgo-8e3a1a28b192.jpg) | 14 |
| Přístrojové odstranění chloupků — Muži | [virgo-ed1dd2234a02.jpg](../public/images/virgo-original/virgo-ed1dd2234a02.jpg) | 26 |
| Přístrojové odstranění chloupků — Ženy | [virgo-becadaa5816c.jpg](../public/images/virgo-original/virgo-becadaa5816c.jpg) | 27 |
| Přístrojové ošetření — Balíčky pro ženy | [virgo-d65c367ca605.jpg](../public/images/virgo-original/virgo-d65c367ca605.jpg) | 8 |
| Přístrojové ošetření — Balíčky pro muže | [virgo-12d8cc1ec8a5.jpg](../public/images/virgo-original/virgo-12d8cc1ec8a5.jpg) | 8 |
| Masáže — jednotlivé procedury a balíčky | [virgo-8b06e6967a1f.jpg](../public/images/virgo-original/virgo-8b06e6967a1f.jpg) | 20 |

Усього: **198 цінових значень у 137 нормалізованих рядках** чотирьох категорій. Один рядок може містити дві гендерні ціни. Початкові 27 рядків (54 значення) збережені без змін; додано 110 рядків і 144 цінових значення. На сайті показуються HTML-таблиці; зображення використовуються лише як джерела для цього аудиту.

## Дублікати та нормалізація

- Загальний прайс депіляції точно збігається з 27 наявними рядками, включно з 750–850 Kč для чоловічих рук. Повторно не додано.
- Розміри й обрізки одного оригіналу не є новими прайсами. Повний перелік варіантів — у `reports/price-audit/unique-images.json`.
- Спільні жіночі/чоловічі позиції зведені в один рядок з двома цінами. Відсутня для статі ціна — null; рядок для цієї статі приховується, не копіюється інша ціна й не ставиться нуль.
- У депіляції «Obočí» та в догляді за бровами «Korekce obočí» мають однакові суми 200/250 Kč. Збережено в різних категоріях з вихідними назвами; не припускаємо, що послуги тотожні.
- У масажах різна тривалість і кількість сеансів — окремі варіанти, а не дублікати.
- Жіноче «½ zad (horní nebo dolní část)», 20 min / 1200 Kč не розмножено на два рядки чоловічих зон спини: у чоловічому джерелі для них 15 min і різні ціни.
- Виправлено лише очевидну чеську орфографію назв (наприклад, «Nárt a prsty»); числа й діапазони не редагувались.

## Початкові ціни депіляції — без змін

| Процедура | Жінки | Чоловіки | Деталі |
|---|---:|---:|---|
| Obličej | 450 Kč | 450 Kč |  |
| Obočí | 200 Kč | 250 Kč |  |
| Horní ret | 200 Kč | 250 Kč |  |
| Brada | 250 Kč | 250 Kč |  |
| Nosní dírky | 200 Kč | 300 Kč |  |
| Uši | 200 Kč | 300 Kč |  |
| Tváře | 300 Kč | 300 Kč |  |
| Krk | 200 Kč | 300 Kč |  |
| Ruce — předloktí | 400 Kč | 490 Kč |  |
| Ruce — nadloktí | 350 Kč | 450 Kč |  |
| Ruce — celé ruce | 550 Kč | 750–850 Kč |  |
| Ruce — prsty | 110 Kč | 150 Kč |  |
| Hruď | 450 Kč | 600 Kč |  |
| Břicho | 400 Kč | 500 Kč |  |
| Pupek | 150 Kč | 170 Kč |  |
| Podpaží | 400 Kč | 400 Kč |  |
| Záda — spodní část | 300 Kč | 600 Kč |  |
| Záda — horní část | 400 Kč | 500 Kč |  |
| Záda — celá záda | 700 Kč | 950 Kč |  |
| Nohy — lýtka (včetně kolen) | 500 Kč | 700 Kč |  |
| Nohy — ¾ (do poloviny stehna) | 800 Kč | 1050 Kč |  |
| Nohy — stehna | 500 Kč | 650 Kč |  |
| Nohy — celé (bez třísel a prstů) | 850 Kč | 1200 Kč |  |
| Nohy — prsty | 150 Kč | 200 Kč |  |
| Hýždě — zevnitř | 200 Kč | 350 Kč |  |
| Hýždě — zvenčí | 400 Kč | 530 Kč |  |
| Hýždě — komplex | 550 Kč | 750 Kč |  |

## Додаткові зони й комбінації депіляції

| Процедура | Жінки | Чоловіки | Деталі |
|---|---:|---:|---|
| Klasické bikiny | 500 Kč | 650 Kč |  |
| Střední bikiny | 750 Kč | 900 Kč |  |
| Brazilská — trojúhelník / proužek | 1000 Kč | 1200 Kč |  |
| Brazilská Hollywood | 1000 Kč | 1200 Kč |  |
| Bikiny + vajacial | 1250 Kč | — |  |
| S-Brazilská + vajacial | 1500 Kč | — |  |
| Hollywood + vajacial | 1750 Kč | — |  |
| Podpaží + lýtka | 850 Kč | — |  |
| Podpaží + bikiny | 1100 Kč | — |  |
| Fitness: podpaží + celé nohy + třísla | 1550 Kč | — |  |
| Fitness: podpaží + polovina nohou + třísla | 1250 Kč | — |  |
| Fitness: podpaží + celé nohy + celé ruce + třísla | 2000 Kč | — |  |
| Hruď + břicho | — | 900 Kč |  |
| Celá záda + tricepsová zóna (k lokti) | — | 1200 Kč |  |
| BSC: záda + vnitřní část hýždí + intimní část | — | 1390 Kč |  |
| Brazilská: intimní části + dolní část břicha + třísla | — | 1650 Kč |  |
| Brazilská sportovní (dolní část břicha) | — | 870 Kč |  |
| Brazilská + manjacial | — | 2700 Kč |  |
| Pro cyklisty: celé nohy + třísla | — | 1620 Kč |  |
| Fitness: hruď + břicho + záda | — | 1670 Kč |  |
| IN: Brazilská Hollywood + celé hýždě | — | 2200 Kč |  |
| Celé tělo | — | 6100 Kč | Kauce 2 000 Kč. |

## Масажі та обгортання

| Процедура | Варіант / тривалість | Ціна |
|---|---|---:|
| Celková masáž | 60 min | 900 Kč |
| Celková masáž | 90 min | 1250 Kč |
| Celková masáž | 120 min | 1700 Kč |
| Masáž zad | 30 min | 450 Kč |
| Masáž šíje | 20 min | 300 Kč |
| Masáž zad a šíje | 60 min | 900 Kč |
| Masáž dolních končetin | 40 min | 550 Kč |
| Masáž dolních končetin | 60 min | 850 Kč |
| Masáž horních končetin | 30 min | 400 Kč |
| Masáž chodidel | 20 min | 300 Kč |
| Záda a baňkování | 50 min | 700 Kč |
| Baňkování | 20 min | 300 Kč |
| Medová masáž | 30 min | 500 Kč |
| Čokoládová masáž | 60 min | 900 Kč |
| Masáž lávovými kameny | 60 min | 900 Kč |
| Masáž proti celulitidě | 60 min | 1000 Kč |
| Masáž proti celulitidě | 90 min | 1400 Kč |
| Masáž proti celulitidě + ozonový zábal | 50 + 25 min | 1250 Kč |
| Masáž proti celulitidě + ozonový zábal | Balíček 5 ošetření | 5649 Kč |
| Masáž proti celulitidě + ozonový zábal | Balíček 10 ošetření | 11249 Kč |
| Maderoterapie | 60 min | 1000 Kč |
| Maderoterapie | 90 min | 1500 Kč |
| Maderoterapie | 3 × 60 min | 2800 Kč |
| Maderoterapie | 5 × 60 min | 4500 Kč |
| Maderoterapie | 3 × 90 min | 4200 Kč |
| Maderoterapie | 5 × 90 min | 6900 Kč |
| Skořicový / bahenní zábal | 1 × 20–30 min | 500 Kč |
| Skořicový / bahenní zábal | 3 ošetření | 1300 Kč |
| Skořicový / bahenní zábal | 5 ošetření | 2300 Kč |
| Skořicový / bahenní zábal | 10 ošetření | 4600 Kč |
| Rašelinový zábal | — | 300 Kč |
| Parafínový zábal rukou | — | 290 Kč |
| Parafínový zábal nohou | — | 320 Kč |
| Indická masáž hlavy | 60 min | 900 Kč |
| Thajská masáž nohou | 60 min | 900 Kč |
| Ájurvédská masáž | 120 min | 1800 Kč |
| Lymfatická masáž | 60 min | 900 Kč |

## Брови та вії

| Процедура | Варіант / тривалість | Ціна |
|---|---|---:|
| Korekce obočí — ženy | — | 200 Kč |
| Korekce obočí — muži | — | 250 Kč |
| Barvení obočí | — | 250 Kč |
| Barvení + korekce obočí | — | 400 Kč |
| Laminace + korekce obočí | — | 550 Kč |
| Laminace + barvení + korekce obočí | — | 700 Kč |
| Zesvětlení obočí | — | 300 Kč |
| Barvení řas | — | 250 Kč |
| Laminace řas | — | 650 Kč |
| Laminace + barvení řas | — | 800 Kč |
| Laminace obočí + řas | — | 1100 Kč |
| Komplex obočí + řasy | — | 1400 Kč |

## Приладове видалення волосся

| Процедура | Жінки | Чоловіки | Деталі |
|---|---:|---:|---|
| Obličej | 1400 Kč | 1800 Kč | 15 min |
| Horní ret | 450 Kč | — | 5 min |
| Úprava kontur vousů | — | 850 Kč | 5 min |
| Brada | 550 Kč | 1000 Kč | 5 min |
| Mezi obočím | 400 Kč | 450 Kč | 5 min |
| Zadní partie krku | 550 Kč | 1050 Kč | 15 min |
| Přední partie krku | 550 Kč | 1050 Kč | 15 min |
| Podpaží | 800 Kč | 900 Kč | 15 min |
| Předloktí | 1400 Kč | 1700 Kč | 25 min |
| Zápěstí + prsty | 700 Kč | 950 Kč | 10 min |
| Celé ruce | 1850 Kč | 2500 Kč | 25 min |
| Hrudník | 1300 Kč | 1800 Kč | 15 min |
| Okolo prsních dvorců | 600 Kč | — | 10 min |
| Břicho | 1300 Kč | 1800 Kč | 20 min |
| Okolo pupíku | 700 Kč | — | 5 min |
| Střední linie pod pupíkem | 700 Kč | — | 5 min |
| Ramena | — | 1800 Kč | 15 min |
| Celá záda | 2200 Kč | 3000 Kč | 35 min |
| ½ zad (horní nebo dolní část) | 1200 Kč | — | 20 min |
| Horní část zad | — | 1800 Kč | 15 min |
| Dolní část zad | — | 1700 Kč | 15 min |
| Hýždě | 1400 Kč | 2000 Kč | 15 min |
| Mezi hýždě | 800 Kč | 1500 Kč | 10 min |
| Třísla | 1200 Kč | 1800 Kč | 15 min |
| Brazílie — intimní partie | 1800 Kč | 2400 Kč | 30 min |
| Lýtka | 1700 Kč | 2200 Kč | 25 min |
| Kolena | 600 Kč | 600 Kč | 10 min |
| Stehna | 1800 Kč | 2300 Kč | 25 min |
| Celé nohy | 3000 Kč | 4000 Kč | 40 min |
| Nárt a prsty | 750 Kč | 1050 Kč | 10 min |
| Celé tělo | 12500 Kč | 15500 Kč |  |

## Пакети приладового видалення волосся

| Процедура | Жінки | Чоловіки | Деталі |
|---|---:|---:|---|
| Brazilka + podpaží | 2100 Kč | 2800 Kč | 1 ošetření |
| Brazilka + podpaží | 11350 Kč | 16790 Kč | 6 ošetření |
| Brazilka + podpaží + lýtka | 3800 Kč | 5050 Kč | 1 ošetření |
| Brazilka + podpaží + lýtka | 20550 Kč | 27300 Kč | 6 ošetření |
| Brazilka + podpaží + celé nohy | 5100 Kč | 6800 Kč | 1 ošetření |
| Brazilka + podpaží + celé nohy | 27550 Kč | 36720 Kč | 6 ošetření |
| Brazilka + podpaží + celé ruce + celé nohy | 6500 Kč | 8900 Kč | 1 ošetření |
| Brazilka + podpaží + celé ruce + celé nohy | 35100 Kč | 48100 Kč | 6 ošetření |

## Дані, яких бракує або які потребують уточнення

- Усі ціни на 10 прайсах вдалося прочитати. Нечитабельних сум не додано.
- На прайсах немає дати чинності; актуальність має підтвердити студія.
- Заголовок Depilace не визначає, чи ціни однакові для цукрової пасти й воску; окремі ціни методик не вигадані.
- Окремої вартості Vajacial/manjacial без депіляції немає: у прайсах наведені комбінації цих процедур із депіляцією, їх не використано як ціну окремого догляду.
- У приладових прайсах немає назви технології/апарата; не перейменовано на лазер/IPL навмання.
- Тривалість відсутня для приладового обробки цілого тіла, торф’яного й парафінових обгортань, а також багатьох пакетів; показано тільки надані дані.
- S-Brazilská і Komplex obočí + řasy не розшифровані. У джерелі є Laminace řas; її не прирівняно автоматично до Lash lifting.
- У прайсі масажів три рядки «+ ozonový zábal» йдуть під масажем проти целюліту. Збережені повні суми 1250/5649/11249 Kč і вихідний формат 50 + 25 min; склад пакета позначено як такий, що потребує підтвердження.
- Для чоловічої депіляції всього тіла збережено окрему примітку Kauce 2000 Kč. Умови застави не вигадані.
- Бронювання веде до наявного Termino; передавання обраної процедури в Termino без підтвердженого API не імітується.

Редагування даних: `src/data/prices.ts`. Машиночитна транскрипція для перевірки — `reports/price-audit/transcribed-prices.json`.

## Перевірка реалізації

- Строгий TypeScript, ESLint і production build пройшли.
- 15 автоматизованих тестів пройшли, включно зі збереженням попередніх цін, джерелами всіх нових рядків, унікальністю ID та вибіркою цін для обох статей.
- Playwright у встановленому Chromium перевірив 4 категорії на 360/390/768/1280 px: 16 комбінацій категорії й ширини, з обома статями в гендерних прайсах. Горизонтального скролу та браузерних JS-помилок не виявлено.
- У кожного рядка є власна доступна кнопка Termino; URL однаковий для всіх процедур, передавання послуги в Termino не імітується.
- Скриншоти перевірено візуально; результати та PNG знаходяться в `reports/price-audit/`. Звіт браузерних перевірок — `browser-results.json`.
- Під час огляду виправлено конфлікт класу `.container` із вбудованою утилітою Tailwind: відновлено передбачені дизайном бокові відступи desktop, палітру та композицію збережено.
