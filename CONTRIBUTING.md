# 🤝 Керівництво для Розробників (CONTRIBUTING.md)

Дякуємо за внесок у проєкт **Smarket**! Це керівництво містить основні правила розробки, підготовки коммітів та роботи з монорепозиторієм.

---

## 🌿 Стратегія Гілок (Git Workflow)

1. **`main`**: Продакшн гілка. Зміни вносяться виключно через pull request із гілки `develop`.
2. **`develop`**: Основна гілка розробки. Всі нові фічі мерджаться сюди.
3. **Фіча-гілки**: Створюйте від `develop` з описовими назвами:
   - `feat/feature-name` — нові функції
   - `fix/bug-name` — виправлення помилок
   - `docs/doc-update` — оновлення документації

---

## 📝 Конвенція Коммітів (Conventional Commits)

Використовуйте стандартні префікси у повідомленнях коммітів:

* `feat:` — нова функціональність (наприклад, `feat(auth): add google oauth2 support`)
* `fix:` — виправлення багу (наприклад, `fix(cart): fix price rounding issue`)
* `docs:` — оновлення документації (наприклад, `docs(readme): update team structure`)
* `refactor:` — рефакторинг коду без зміни поведінки
* `test:` — додавання або оновлення тестів
* `chore:` — рутинні завдання, оновлення залежностей

---

## 🛠 Стандарти Коду за Сервісами

### Python (FastAPI, FastStream)
* **Лінтер та форматер**: `ruff` (`uv run ruff check .` та `uv run ruff format .`).
* **Асинхронність**: Весь код БД виконується асинхронно через `AsyncSession` SQLAlchemy 2.0.
* **Міграції**: Зміни моделей виконуються виключно через Alembic:
  ```bash
  cd services/<service_name> && alembic revision --autogenerate -m "description"
  cd services/<service_name> && alembic upgrade head
  ```

### Go (`services/products_etl`)
* **Форматування**: `gofmt`
* **Перевірка**: `go vet ./...`

### Rust (`services/search_service`)
* **Форматування**: `cargo fmt`
* **Лінтер**: `cargo clippy`

---

## 🧪 Обов'язкова Локальна Перевірка

Перед створенням Pull Request переконайтеся, що всі тести проходять успішно:

```bash
make test
# або напряму: python scripts/run_service_tests.py
```
