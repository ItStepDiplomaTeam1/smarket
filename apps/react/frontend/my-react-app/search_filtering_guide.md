# 🔍 Документація API пошуку та фільтрації (для Фронтенду)

Основний універсальний ендпоінт для пошуку, каталогу, пагінації та фільтрації товарів у монорепозиторії Smarket — це **`GET /api/v1/search/search`** (через API Gateway).

---

## 📡 Деталі ендпоінту

*   **URL:** `http://157.180.74.21:8080/api/v1/search/search` (або `http://localhost:8080/api/v1/search/search` локально)
*   **Метод:** `GET`
*   **Призначення:** Повнотекстовий пошук товарів та застосування фільтрів (за категоріями, підкатегоріями, цінами, наявністю, супермаркетами та акціями).

---

## 🎛️ Параметри запиту (Query Parameters)

Ви можете комбінувати будь-які параметри для реалізації гнучких фільтрів.

| Параметр | Тип | Опис | Приклад запиту |
| :--- | :--- | :--- | :--- |
| **`q`** | `string` | Текст пошукового запиту (по назві або бренду). | `?q=молоко` |
| **`limit`** | `number` | Кількість результатів на сторінку (за замовчуванням `20`, макс `100`). | `?limit=12` |
| **`offset`** | `number` | Зсув сторінки для пагінації (розраховується як `(page - 1) * limit`). | `?offset=24` |
| **`category_slug`** | `string` | **Верхньорівнева категорія.** При надсиланні значень: `drinks`, `baby`, `chemistry`, `beauty`, `home`, `zoo` бекенд автоматично мапить їх на універсальні `main_category_id` (1–10). | `?category_slug=drinks` |
| **`subcategory_slug`** | `string` (повторюваний) | **Підкатегорія (фільтри у сайдбарі).** Автоматично розгортається на бекенді під усі мережеві суфікси (`-silpo`, `-novus` тощо). Можна надсилати декілька. | `?subcategory_slug=molochni-produkty&subcategory_slug=frozen` |
| **`retail_chain`** | `string` (повторюваний) | Фільтрація по мережах супермаркетів. Працює через логіку `OR`. | `?retail_chain=atb&retail_chain=silpo` |
| **`price_min`** | `number` | Мінімальна ціна. | `?price_min=15.50` |
| **`price_max`** | `number` | Максимальна ціна. | `?price_max=120` |
| **`in_stock`** | `boolean` | Тільки товари в наявності (`true` або `false`). | `?in_stock=true` |
| **`offer_type`** | `string` (повторюваний) | Фільтрація спецпропозицій: `promo`/`save` (товари зі знижкою) та `new` (товари створені за останні 14 днів). | `?offer_type=promo&offer_type=new` |
| **`sort`** | `string` | Сортування результатів: `price:asc` (дешевші спочатку) або `price:desc` (дорожчі спочатку). | `?sort=price:asc` |

---

## ⚡ Робота категорій та підкатегорій (Без змін на фронтенді)

Бекенд повністю бере на себе складну логіку мапування та розширення слагов, тому фронтенд може надсилати свої існуючі ідентифікатори:

1.  **Категорії (`category_slug`):**
    Бекенд перетворює спрощені назви на ідентифікатори:
    *   `drinks` ➔ `main_category_id = 2` (Напої)
    *   `baby` ➔ `main_category_id = 8` (Дитячі товари)
    *   `chemistry` ➔ `main_category_id = 5` (Побутова хімія)
    *   `beauty` ➔ `main_category_id = 6` (Краса та догляд)
    *   `home` ➔ `main_category_id = 5` (Товари для дому)
    *   `zoo` ➔ `main_category_id = 7` (Зоотовари)
    *   *`products`* (або порожньо) ➔ фільтр категорій не застосовується (показуються всі товари).

2.  **Підкатегорії (`subcategory_slug`):**
    Коли фронтенд обирає підкатегорію (наприклад, `vegetables`), бекенд автоматично знаходить префікс у базі (`fruits-and-vegetables`) та генерує список слагов для пошуку по всіх магазинах:
    `category_slug IN ["fruits-and-vegetables", "fruits-and-vegetables-silpo", "fruits-and-vegetables-novus", ...]`

---

## 📦 Формат відповіді (Response JSON)

Ендпоінт повертає стандартизовану відповідь пошукового рушія:

```json
{
  "hits": [
    {
      "id": "112358",
      "title": "Молоко Селянське 2.5% 900г",
      "brand": "Селянське",
      "unit": "кг",
      "weight": 0.9,
      "image_url": "https://images.zakaz.ua/...",
      "canonical_ean": "4820002901234",
      "category_id": 23,
      "category_slug": "molochni-produkty-silpo",
      "category_name": "Молочні продукти",
      "main_category_id": 1,
      "offers": [
        {
          "store": {
            "id": "silpo-123",
            "name": "Сільпо (Київ, вул. Шевченка)",
            "retail_chain": "silpo"
          },
          "price": 38.5,
          "old_price": 45.9,
          "in_stock": true
        }
      ]
    }
  ],
  "total_hits": 120,
  "offset": 0,
  "limit": 12,
  "nb_hits": 1,
  "processing_time_ms": 12,
  "query": "молоко"
}
```

### 🔑 Важливі поля для пагінації та UI:
*   `total_hits`: Загальна кількість знайдених товарів, що відповідають усім фільтрам. Використовуйте це поле для підрахунку кількості сторінок: `Math.ceil(total_hits / limit)`.
*   `hits`: Масив товарів. Кожен товар містить масив `offers` з цінами у конкретному магазині та мережі.
*   `main_category_id`: Поле присутнє в кожному товарі, що дозволяє швидко визначити його глобальну категорію.

---

## 🚀 Приклади запитів API

### 1. Каталог "Всі продукти" з пагінацією (1 сторінка по 12 товарів)
```bash
GET http://157.180.74.21:8080/api/v1/search/search?q=&limit=12&offset=0
```

### 2. Товари зі знижкою у мережах АТБ та Сільпо
```bash
GET http://157.180.74.21:8080/api/v1/search/search?q=&retail_chain=atb&retail_chain=silpo&offer_type=promo&limit=12
```

### 3. Молочна продукція та свіжа випічка дешевше 100 грн
```bash
GET http://157.180.74.21:8080/api/v1/search/search?q=&subcategory_slug=molochni-produkty&subcategory_slug=hlib-ta-vypichka&price_max=100&limit=12
```

### 4. Новинки у категорії "Напої"
```bash
GET http://157.180.74.21:8080/api/v1/search/search?q=&category_slug=drinks&offer_type=new&limit=12
```
