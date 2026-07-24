## 1. Frontend Product Detail Loading Fixes

- [x] 1.1 Refactor `fetchProduct` in `ProductDetail.tsx` to handle retry loops without premature `finally { setIsLoading(false); }` execution.
- [x] 1.2 Update condition checks in `ProductDetail.tsx` so "Товар не знайдено" only renders when `notFound === true` and loading is completely finished.
- [x] 1.3 Add immediate abort on 404 responses during product fetch to prevent unnecessary retries.

## 2. Auth Service Cross-Domain Cookie Fixes

- [x] 2.1 Update `refresh_token` cookie settings in `services/auth_service` to include `samesite="none"` and `secure=True` for cross-domain requests.

## 3. Verification & Testing

- [x] 3.1 Verify product page navigation smoothly displays loading state without flickering "Товар не знайдено".
- [x] 3.2 Test invalid product ID navigation returns "Товар не знайдено" cleanly.
