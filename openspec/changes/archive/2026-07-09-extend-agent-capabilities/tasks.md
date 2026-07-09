## 1. Backend Schemas & Main Configs

- [x] 1.1 Додати нові типи екшенів (`navigate` та `apply_filters`) та їх відповідні пейлоади в схему `ActionButtonBlock` у файлі [schemas.py](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/zephyros_agent/app/schemas.py).
- [x] 1.2 Оновити Pydantic-моделі для підтримки валідації нових типів кнопок та екшенів.

## 2. Backend Tools & Prompt Engineering

- [x] 2.1 Реалізувати інструменти `clear_user_cart` та `remove_item_from_cart` у файлі [tools.py](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/zephyros_agent/app/tools.py) для інтеграції з відповідними ендпоінтами `cart_service`.
- [x] 2.2 Реалізувати інструмент порівняння ціни всього кошика `compare_cart_stores` у [tools.py](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/zephyros_agent/app/tools.py), що викликає `/cart/{cart_id}/compare`.
- [x] 2.3 Реалізувати інструменти відгуків `get_product_reviews` та `create_product_review` у [tools.py](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/zephyros_agent/app/tools.py) для інтеграції з `reviews_service`.
- [x] 2.4 Додати нові інструменти до агента в [zephyros.py](file:///c:/Users/ashfromsky/PycharmProjects/smarket/services/zephyros_agent/app/agent/zephyros.py) та оновити `SYSTEM_PROMPT` з детальними інструкціями щодо їхнього використання (зокрема, використання кнопок дій з новими екшенами).

## 3. Frontend Store & Hooks

- [x] 3.1 Оновити типи `UIBlock` та `ZephyrosResponse` у файлі [useAiChatStore.ts](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/AiChat/store/useAiChatStore.ts) для синхронізації з оновленими бекенд-схемами.
- [x] 3.2 Перевірити правильність проходження запитів через `useSendAiMessage` у [useAiChatApi.ts](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/hooks/api/useAiChatApi.ts).

## 4. Frontend UI Widget & Routing Integration

- [x] 4.1 Додати обробку екшену `navigate` у компоненті `ActionButtonView` файлу [AiChatWidget.tsx](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx), викликаючи React-Router `navigate()`.
- [x] 4.2 Додати обробку екшену `apply_filters` у `ActionButtonView` файлу [AiChatWidget.tsx](file:///c:/Users/ashfromsky/PycharmProjects/smarket/apps/react/frontend/my-react-app/src/modules/AiChat/components/AiChatWidget.tsx), імпортуючи стор фільтрів та застосовуючи отримані параметри до каталогу, після чого автоматично закривати чат.
- [x] 4.3 Додати швидкі кнопки дій (наприклад, "Порівняти мій кошик", "Написати відгук") у заголовок чату або в onboarding-меню `EmptyState`.

## 5. Verification & Testing

- [x] 5.1 Запустити локальний сервер `zephyros_agent` та перевірити роботу нових інструментів за допомогою pytest або ручних запитів до FastAPI swagger.
- [x] 5.2 Перевірити збірку фронтенду за допомогою `npm run build` або перевірити коректність типів TypeScript.
