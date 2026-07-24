## Context

Сторінка детального перегляду товару `ProductDetail.tsx` використовує асинхронний метод `fetchProduct` з можливістю 1 повторної спроби (retry) через 1000мс у випадку мережевого збою. 
Виявлено архітектурний недолік у потоці станів: блок `finally { setIsLoading(false); }` при використанні рекурсивного виклику `return fetchProduct(retries - 1)` у `catch` завершує виконання першого проходу функції і переключає `isLoading` у `false` до того, як другий (повторний) запит отримає відповідь від API. В результаті утворюється проміжний стан: `isLoading == false`, `product == null`, `notFound == false`. Оскільки умовний рендеринг перевіряє `if (notFound || !product)`, сторінка показує заглушку "Товар не знайдено".

Крім того, у браузері відхиляється cookie `refresh_token` при запитах між `smarket-7go.pages.dev` та `smarket-api.duckdns.org`, оскільки для cookie не вказано `SameSite=None; Secure`.

## Goals / Non-Goals

**Goals:**
- Усунути миготіння екрана "Товар не знайдено" при відкритті товару в `ProductDetail.tsx`.
- Зробити прапорець `isLoading` активним протягом усього циклу ретраїв.
- Розділити перевірки `isLoading`, `notFound` (404 response) та відсутності даних `!product`.
- Забезпечити коректну передачу авторизаційних cookie `refresh_token` у крос-доменному контексті (`SameSite=None; Secure`).

**Non-Goals:**
- Повний рефакторинг API клієнта `apiClient.ts` або зміна TanStack Query у всьому проєкті.
- Зміна структури даних товару в бекенді.

## Decisions

1. **Рефакторинг `fetchProduct` у `ProductDetail.tsx`**:
   - Замість рекурсивного виклику `fetchProduct(retries - 1)` всередині `catch`, використовувати цикл `for (let attempt = 0; attempt <= maxRetries; attempt++)` або управляти прапорцем `isLoading` тільки на самому початку і в самому кінці зовнішньої функції.
   - Альтернатива (відхилена): Використання TanStack `useQuery` безпосередньо у `ProductDetail.tsx`. Відхилено, оскільки поточний компонент вже має власну обробку та SEO URL редиректи.

2. **Явне розділення станів UI**:
   - Экран "Товар не знайдено" повинен показуватись **виключно** при `notFound === true` або після повного вичерпання ретраїв та підтвердженого 404/ошибки.
   - При `isLoading === true` завжди відображається спінер/завантажувач.

3. **Оновлення конфігурації Cookie в `auth_service`**:
   - Встановити `samesite="none"` та `secure=True` для `refresh_token` cookie у відповідях `auth_service` при продакшн середовищі.

## Risks / Trade-offs

- [Risk] Браузери вимагають `HTTPS` для cookie з `SameSite=None; Secure`.
  → *Mitigation*: У продакшені Smarket використовує HTTPS через Cloudflare / DuckDNS.

- [Risk] Збільшений час очікування при дійсно відсутньому товарі (до 2-3 секунд через ретрай).
  → *Mitigation*: Якщо API повертає 404 Not Found, не робити ретрай, а відразу виставляти `setNotFound(true)`.
