## Context

Фронтенд (`MainContent.tsx`) відправляє запити до `GET /api/v1/search/search` з наступними категоріальними параметрами:
- `category_slug`: значення на кшталт `drinks`, `baby`, `chemistry`, `beauty`, `home`, `zoo` (коли обрано вкладку категорії).
- `subcategory_slug`: масив значень на кшталт `molochni-produkty`, `myaso-ta-ptytsya`, `hlib-ta-vypichka`, `vegetables`, `fish`, `grains`, `frozen`, `cans`.

Meilisearch містить лише мережево-залежні слаги (наприклад, `drinks-silpo`, `molochni-produkty-novus` тощо). Будь-який фільтр по точному співпадінню зі спрощеними слагами повертає 0 результатів. Нам потрібно реалізувати прозоре мапування та розгортання слагов на бекенді в `search_service`.

## Goals / Non-Goals

**Goals:**
- Автоматично перетворювати `category_slug` від фронтенду на `main_category_id` фільтр.
- Автоматично перетворювати `subcategory_slug` на список мережевих слагов та фільтрувати через Meilisearch `IN` оператор.
- Жодних змін на фронтенді (параметри та URL залишаються незмінними).

**Non-Goals:**
- Зміна структури індексу чи ETL (дані вже мають `main_category_id` та `category_slug`).

## Decisions

### D1: Мапування `category_slug` на `main_category_id`
Якщо параметр `category_slug` містить один зі слагов категорій фронтенду, ми перетворюємо його на фільтр `main_category_id = N`:
- `drinks` -> `main_category_id = 2` (Drinks)
- `baby` -> `main_category_id = 8` (Babies)
- `chemistry` -> `main_category_id = 5` (Household)
- `home` -> `main_category_id = 5` (Household)
- `beauty` -> `main_category_id = 6` (Health & Beauty)
- `zoo` -> `main_category_id = 7` (Pets)

Якщо приходить будь-який інший slug, ми використовуємо його як звичайний текстовий фільтр `category_slug = "..."`.

### D2: Авторозширення `subcategory_slug`
Кожен підтримуваний slug підкатегорії з фронтенду мапиться на один або кілька префіксів баз даних:
- `molochni-produkty` -> `["molochni-produkty"]`
- `myaso-ta-ptytsya` -> `["myaso-ta-ptytsya"]`
- `hlib-ta-vypichka` -> `["bakery"]`
- `vegetables` -> `["fruits-and-vegetables"]`
- `fish` -> `["fish-and-seafood"]`
- `grains` -> `["grocery", "packets-cereals", "pulses-and-grain", "pasta"]`
- `frozen` -> `["frozen"]`
- `cans` -> `["canned-food", "tins-jars-cooking", "canned-food-oil-vinegar"]`

Для кожного отриманого префікса ми генеруємо повний набір слагов із суфіксами активних мереж магазинів:
- Суфікси: `""` (без суфіксу), `"-silpo"`, `"-novus"`, `"-eko-market"`, `"-ekomarket"`, `"-metro"`, `"-chudomarket"`, `"-megamarket"`, `"-ultramarket"`, `"-tavriav"`, `"-cosmos"`, `"-vostorg"`, `"-kharkiv"`, `"-epicentr"`, `"-zaraz"`, `"-torba"`, `"-grono"`, `"-winetime"`, `"-ideal"`, `"-onde"`.

Усі згенеровані слаги об'єднуються в один масив та передаються у фільтр Meilisearch:
`category_slug IN ["molochni-produkty", "molochni-produkty-silpo", "molochni-produkty-novus", ...]`

## Risks / Trade-offs

- **[Risk] Додавання нового магазину потребує оновлення списку суфіксів** -> Якщо з'явиться новий ритейлер на Zakaz.ua, його суфікс потрібно буде додати до списку в `search_service`. *Mitigation*: список мереж змінюється вкрай рідко, це прийнятний трейд-оф для збереження простоти фронтенду.
