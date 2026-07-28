## Context

В Go ETL воркере (`services/products_etl/internal/service/transformers.go`) запись цен производилась с условием `recorded_at > NOW() - INTERVAL '3 hours'`. Когда интервал между парсингами превышал 3 часа (или при периодических кронах), это приводя к тому, что подзапрос `NOT EXISTS` не находил последнюю записанную цену и повторно вставлял идентичные записи. Дополнительно, передача `float64` параметров в Postgres типы `NUMERIC(10,2)` в условиях `WHERE price = $3` приводила к неуспешному сравнению при округлении, а отсутствие отсечения повторок внутри одной страницы товары порождало внутрипакетные дубликаты.

## Goals / Non-Goals

**Goals:**
- Исключить повторную запись не изменившихся цен в таблицу `prices` независимо от того, сколько времени прошло с последней записи.
- Ограничить проверку `NOT EXISTS` **абсолютно последней** записью цен для пары `(product_id, store_id)`.
- Добавить приведение типов `$3::numeric(10,2)` для гарантии точности SQL-сравнения чисел.
- Реализовать внутрипакетную дедубликацию товаров в пам'яти воркера Go.
- Предоставить SQL-скрипт/миграцию для удаления накопившихся исторически последовательных дубликатов из БД.

**Non-Goals:**
- Изменение структуры самой таблицы `prices` или внешнего вида API.
- Перевод таблицы `prices` с Postgres на TimescaleDB / MongoDB.

## Decisions

### 1. Сравнение с абсолютным топом `ORDER BY recorded_at DESC LIMIT 1`
Вместо `recorded_at > NOW() - INTERVAL '3 hours'` SQL-запрос проверяет только последнюю запись:
```sql
INSERT INTO prices (product_id, store_id, price, old_price, in_stock, recorded_at)
SELECT $1, $2, $3, $4, $5, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM (
        SELECT price, old_price, in_stock
        FROM prices
        WHERE product_id = $1 AND store_id = $2
        ORDER BY recorded_at DESC
        LIMIT 1
    ) latest
    WHERE latest.price = $3::numeric(10,2)
      AND latest.in_stock = $5
      AND (latest.old_price IS NOT DISTINCT FROM $4::numeric(10,2))
)
```
*Rationale:* Запрос использует существующий индекс `idx_prices_store_product` `ON prices (store_id, product_id, recorded_at DESC)`, что делает выборку одной (последней) строки чрезвычайно быстрой.

### 2. Приведение типов параметров в SQL (`::numeric(10,2)`)
*Rationale:* В Go цена хранится в виде `float64`. Передача `float64` прямо в параметр без явного приведения в SQL могла вызывать расхождения со столбцом `NUMERIC(10,2)`. Явный cast `$3::numeric(10,2)` гарантирует совпадение.

### 3. In-memory дедубликация внутри батча
Перед отправкой батча в `pgx.Batch`, воркер запоминает обработанные `fmt.Sprintf("%d_%s", productID, storeID)` в хеш-таблице `seenProductStore map[string]bool`.
*Rationale:* Предотвращает попытку вставить дважды один и тот же товар в пределах одной и той же страницы или одного вызова `TransformAndLoadPage`.

### 4. Миграция для очистки последовательных дубликатов
Миграция в `migrate.go` с использованием оконной функции `LAG()` для удаления дублирующих подряд строк:
```sql
WITH numbered_prices AS (
    SELECT id, product_id, store_id, price, old_price, in_stock, recorded_at,
           LAG(price) OVER (PARTITION BY product_id, store_id ORDER BY recorded_at, id) AS prev_price,
           LAG(old_price) OVER (PARTITION BY product_id, store_id ORDER BY recorded_at, id) AS prev_old_price,
           LAG(in_stock) OVER (PARTITION BY product_id, store_id ORDER BY recorded_at, id) AS prev_in_stock
    FROM prices
)
DELETE FROM prices
WHERE id IN (
    SELECT id FROM numbered_prices
    WHERE price = prev_price
      AND in_stock = prev_in_stock
      AND (old_price IS NOT DISTINCT FROM prev_old_price)
);
```

## Risks / Trade-offs

- **[Risk]** Большое время выполнения миграции на больших объёмах данных `prices`.  
  *Mitigation:* Выполнение миграции батчами или использование временного индекса.
