# 🗂️ План переробки системи категорій товарів

> **Статус:** Погоджений до реалізації
> **Дата:** 2026-06-19
> **Власник схеми БД:** `products_etl` (Go) · **Споживач (read-only):** `product_service` (Python)

---

## 📌 1. Контекст та проблема

Наразі у системі **відсутня повноцінна сутність «категорія»**. Замість неї існує лише таблиця-маппінг `store_categories_mapping(slug, canonical_category_id INT)` без FK та без жодних людських імен. Значення `canonical_category_id` — голий `INTEGER` на `products`, який не посилається нікуди.

### Що не так

| Проблема | Де | Наслідок |
| :--- | :--- | :--- |
| Немає таблиці категорій з іменами | — | Фронтенд бачить лише число `canonical_category_id` («Категорія ID»), без назви |
| Невідомі слаги падають у `999` | `transformers.go:623` (`ResolveCategoryID`) | Усі нові слаги авто-додаються з `canonical_category_id = 999` і чекають на **ручне** оновлення, яке ніхто не робить |
| `999` — «смітник» без FK | `products.canonical_category_id` | Неможливо побудувати коректний фільтр/меню категорій |
| `ON CONFLICT` не оновлює категорію | `transformers.go:427, 443` | Навіть після виправлення логіки **наявні** товари назавжди залишаться з `999` — потрібен бекфіл |
| Скрейпляться лише top-level слаги | `loaders.go:281` | Це і добре (плоский список), але треба ще зберегти поле `title` з API |

### Аналіз живого API Zakaz.ua

Ендпоінт `GET /stores/{store_id}/categories/` повертає **дерево**:

```json
{
  "id": "fresh-meat",          // slug — використовується в URL продуктів
  "title": "Свіже м'ясо",       // 👈 українська назва (є!)
  "count": 42,
  "parent_id": "meat-fish-poultry",
  "children": [ /* вкладені підкатегорії */ ]
}
```

**Висновок:** API вже дає і slug, і людське ім'я (`title`). Категорії **глобальні** (однакові для всіх магазинів Zakaz — Ашан, Novus, Metro), тож прив'язка «поза залежністю від магазину» вже практично виконана.

---

## 🎯 2. Мета та погоджені рішення

**Мета:** автоматичне створення та наповнення категорій з людськими іменами, автоматична прив'язка товарів до категорій — без ручного втручання, для всіх магазинів одночасно.

### Погоджені рішення (з обговорення)

| # | Питання | Рішення |
| :--- | :--- | :--- |
| 1 | Джерела даних | **Лише Zakaz.ua** — слаги вже уніфіковані між мережами |
| 2 | Ієрархія | **Плоский список** (без `parent_id`, без деревовидної структури) |
| 3 | Джерело імені | **Із API Zakaz** (поле `title`, українською) |
| 4 | Гранулярність | **Лише верхній рівень** дерева категорій (~15–20 широких) |

> **Підхід:** Варіант «A» — кожен Zakaz-слаг верхнього рівня = одна категорія. Авто-створення без маппінгу, без `999`.

---

## 🗄️ 3. Нова схема бази даних

### Нова таблиця `categories`

```sql
CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL      PRIMARY KEY,
    slug       TEXT        UNIQUE NOT NULL,   -- slug верхнього рівня з API Zakaz (напр. "fresh-meat")
    name       TEXT        NOT NULL,          -- українська назва з поля title (напр. "Свіже м'ясо")
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Зміни в `products`

```sql
-- 1. Зробити колонку FK (nullable — допускаємо товари без категорії)
ALTER TABLE products
    DROP COLUMN IF EXISTS canonical_category_id,
    ADD COLUMN canonical_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
```

> 📝 **Ім'я колонки зберігається** (`canonical_category_id`) — щоб мінімізувати зміни в Python-моделях, схемах, фронтенді та документації. Семантично тепер це FK.

### Видалення застарілого

```sql
DROP TABLE IF EXISTS store_categories_mapping;
```

Slug тепер живе в `categories.slug`, маппінг-таблиця більше не потрібна.

---

## ⚙️ 4. Зміни в `products_etl` (Go) — власник схеми

### 4.1. `database/migrate.go`

| Дія | Деталі |
| :--- | :--- |
| Створити `categories` | блок `CREATE TABLE IF NOT EXISTS categories (...)` |
| Видалити `store_categories_mapping` | `DROP TABLE IF EXISTS store_categories_mapping;` |
| Перевизначити `products.canonical_category_id` | drop + add з FK `REFERENCES categories(id) ON DELETE SET NULL` |

> ⚠️ Дроп колонки + повторне додавання з FK виконується **після** бекфілу (див. §6), щоб не порушити існуючі дані проміжно. У `RunMigrations` додати охоронний блок з `IF EXISTS` / `IF NOT EXISTS`.

### 4.2. `internal/service/loaders.go`

```go
// Розширити categoryItem полем title:
type categoryItem struct {
    Slug  string `json:"id"`    // slug для URL
    Title string `json:"title"` // 👈 нове поле — українська назва
}
```

`fetchCategorySlugs` повертає додатково `title` для сида. Обхід `children` **не робимо** (плоский список, лише верхній рівень).

### 4.3. `internal/service/seed.go` — нова функція `SeedCategories`

```
SeedCategories:
  1. Обрати один активний магазин (перший із stores WHERE is_active=true)
     — слаги глобальні, достатньо одного магазину для отримання майже всіх імен
  2. GET /stores/{store_id}/categories/  → []categoryItem (лише top-level)
  3. UPSERT у categories:
        INSERT INTO categories (slug, name) VALUES ($1, $2)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     (оновлення name гарантує актуальність при зміні назв у Zakaz)
  4. Лог: кількість засіяних/оновлених категорій
```

Виклик `SeedCategories` додається в `main.go` поруч із `SeedStores` (після нього, оскільки потрібен хоч один active store).

### 4.4. `internal/service/transformers.go` — переписати `ResolveCategoryID`

```
ResolveCategoryID(ctx, pgPool, slug) -> (int, error):
  SELECT id FROM categories WHERE slug = $1
  ┌─ знайдено → повернути id
  └─ не знайдено (pgx.ErrNoRows):
       INSERT INTO categories (slug, name) VALUES ($1, '')
         ON CONFLICT (slug) DO NOTHING
         RETURNING id            // або повторний SELECT, якщо RETURNING порожнє через ON CONFLICT
       лог: "Новий slug %q додано (name порожнє — заповниться наступним SeedCategories)"
       повернути новий id
```

**Жодного `unknownCategoryId = 999`.** Константу `unknownCategoryId` (`transformers.go:19`) — видалити.

### 4.5. `internal/service/transformers.go` — оновити обидва `ON CONFLICT DO UPDATE`

Додати `canonical_category_id` до `SET` у **обох** UPSERT-блоках:

- EAN-товар (`transformers.go:427`):
  ```
  ON CONFLICT (canonical_ean) DO UPDATE SET
      ... ,
      canonical_category_id = EXCLUDED.canonical_category_id   -- 👈 додати
  ```
- Товар без EAN (`transformers.go:443`):
  ```
  ON CONFLICT (store_product_id, store_id) WHERE canonical_ean IS NULL DO UPDATE SET
      ... ,
      canonical_category_id = EXCLUDED.canonical_category_id   -- 👈 додати
  ```

> Без цього наявні товари ніколи не отримають нову категорію після бекфілу.

---

## 🐍 5. Зміни в `product_service` (Python, read-only)

### 5.1. `app/database/models.py`

- **Видалити** клас `StoreCategoryMapping` (рядки ~65–75).
- **Додати** нову модель:
  ```python
  class Category(Base):
      __tablename__ = "categories"
      id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
      slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
      name: Mapped[str] = mapped_column(String, nullable=False)
      created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
  ```
- `Product.canonical_category_id` — залишити як `Mapped[Optional[int]]`, додати `relationship("Category")` за бажанням.

### 5.2. `app/shared/schemas.py`

```python
class CategoryResponse(BaseModel):
    id: int
    slug: str
    name: str   # 👈 нове поле
```

### 5.3. `app/routers/products.py` — ендпоінт `/categories`

Переписати з поточного (рядки ~413–436, що робить `DISTINCT` + in-memory дедуп) на простий запит:

```python
stmt = select(Category).order_by(Category.name)
```

Повертає `[CategoryResponse]` з `{id, slug, name}`. Жодних `seen`-множин — таблиця `categories` вже унікальна по slug.

---

## 🔄 6. План міграції даних (бекфіл)

Оскільки всі поточні значення `canonical_category_id` — «сміття» (`999`), а FK не дозволить залишити `999`:

```
Крок 1.  Створити таблицю categories (migrate.go)
Крок 2.  SeedCategories — заповнити categories з API (slug + name)
Крок 3.  UPDATE products SET canonical_category_id = NULL   -- скинути сміття 999
Крок 4.  ALTER TABLE products
           DROP COLUMN canonical_category_id,
           ADD COLUMN canonical_category_id INTEGER REFERENCES categories(id)
             ON DELETE SET NULL
Крок 5.  DROP TABLE store_categories_mapping
Крок 6.  Оновити Python-моделі/схеми/ендпоінт (product_service)
Крок 7.  Дочекатися наступного циклу ETL (≤2 год) — він автоматично
         переприв'яже ВСІ товари до правильних категорій через UPSERT
         (завдяки доданому canonical_category_id = EXCLUDED.canonical_category_id)
```

> ✅ **Ручний бекфіл не потрібний.** ETL-цикл сам усе виправить — кожен товар отримає `categoryID` зі свого слага під час наступного проходу.

---

## 🤖 7. Як працює автоматика (підсумок)

```
┌─────────────────────────────────────────────────────────────────┐
│  СТАРТ products_etl                                              │
│   ├─ RunMigrations → створює categories + FK                    │
│   ├─ SeedStores      → оновлює магазини                          │
│   └─ SeedCategories  → GET /categories/ → UPSERT (slug, title)   │
│                                                                   │
│  ЦИКЛ ETL (кожні 2 год)                                          │
│   ├─ fetchCategorySlugs  → лише top-level slugs                  │
│   ├─ fetchAndStoreAllPages → Mongo (raw)                         │
│   └─ Transform & Load:                                           │
│        └─ ResolveCategoryID(slug) → categories.id                │
│             ├─ знайдено → повернути id                           │
│             └─ ні → INSERT...RETURNING id (авто-створення)       │
│        └─ UPSERT product з canonical_category_id = id            │
│             └─ ON CONFLICT DO UPDATE ... канон.категорію теж     │
│        └─ pg_notify('products_updated')                          │
└─────────────────────────────────────────────────────────────────┘
```

**Властивості системи після реалізації:**

- ✅ Категорії з'являються **автоматично** (сайд + ліниве створення в `ResolveCategoryID`)
- ✅ Імена категорій — **українською**, з API Zakaz
- ✅ Товари прив'язуються **автоматично** в UPSERT
- ✅ Працює **для всіх магазинів** одночасно (слаги глобальні)
- ✅ Жодних `999`, жодного ручного маппінгу
- ✅ `product_service` отримує готову таблицю `categories` для меню/фільтрів

---

## 📁 8. Реєстр змінених файлів

| Файл | Тип зміни |
| :--- | :--- |
| `services/products_etl/database/migrate.go` | DDL `categories`, FK, drop `store_categories_mapping` |
| `services/products_etl/internal/service/seed.go` | Нова `SeedCategories` |
| `services/products_etl/internal/service/loaders.go` | `categoryItem.Title`, `fetchCategorySlugs` повертає `[]categoryItem` |
| `services/products_etl/internal/service/transformers.go` | Переписати `ResolveCategoryID`; додати `canonical_category_id` в обидва `ON CONFLICT SET`; видалити `unknownCategoryId` |
| `services/products_etl/main.go` | Виклик `SeedCategories` після `SeedStores` |
| `services/product_service/app/database/models.py` | Видалити `StoreCategoryMapping`; додати `Category`; FK + `relationship("Category")` на `Product` |
| `services/product_service/app/shared/schemas.py` | `CategoryResponse` + поле `name` |
| `services/product_service/app/routers/products.py` | Переписати `GET /categories` на `select(Category).order_by(Category.name)` |
| `services/product_service/migrations/env.py` | Оновити коментар (замінити `store_categories_mapping` → `categories`) |
| `docs/products_integration_ua.md` | Оновити §3 (схему) та §7 (ендпоінт `/categories`) |
| `Gemini.md` | Оновити опис моделей `product_service` |
| `docs/categories-reworking-plan.md` | Цей документ |

---

## ⚠️ 9. Ризики та граничні випадки

| Ризик | Пом'якшення |
| :--- | :--- |
| Сайд обирає магазин без повного набору категорій | Слаги глобальні; беремо перший `is_active` store. Ліниве створення в `ResolveCategoryID` підстрахує |
| Zakaz змінює slug верхнього рівня | З'явиться нова категорія, стара залишиться без товарів. На практиці slug-и стабільні |
| Товари без категорії (`category_id = NULL`) | Допустимо — FK nullable, `ON DELETE SET NULL`. Фільтр `category_id` просто не покаже такі товари |
| Дуплікація імен при різних slug | `name` не UNIQUE (лише `slug`). Якщо два slug мають однаковий `title` — буде дві категорії; прийнятно для плоского списку |
| Розрив з фронтендом (оновлення моделі) | Фронтенд `About.tsx:20` показує `canonical_category_id` як число — треба показувати `name`. Окрема задача фронтенду |

---

## ✅ 10. Критерії готовності

- [x] Таблиця `categories` створена, засіяна з API (slug + name)
- [x] `products.canonical_category_id` — FK → `categories(id)`, nullable
- [x] `store_categories_mapping` видалена
- [x] `ResolveCategoryID` не використовує `999`, авто-створює категорії
- [x] Обидва `ON CONFLICT DO UPDATE` оновлюють `canonical_category_id`
- [x] `SeedCategories` викликається при старті ETL
- [x] Python `Category`-модель, `CategoryResponse.name`, оновлений `/categories`
- [ ] Після циклу ETL: жодного товару з `canonical_category_id = 999` (або `NULL` лише для тех.випадків) — _перевіряється після перезапуску ETL_
- [ ] `GET /api/v1/products/categories` повертає `[{id, slug, name}, ...]` — _перевіряється після перезапуску ETL_
- [x] Документація `docs/products_integration_ua.md` оновлена

> ℹ️ Дві останні позначки вимагають запуску ETL-циклу та живої БД — код реалізовано, рантайм-верифікація виконується після деплою.
