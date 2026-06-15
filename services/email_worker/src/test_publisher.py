import asyncio
from faststream.rabbit import RabbitBroker
from config import settings

async def main():
    # 1. Створюємо брокер з тими ж налаштуваннями, що й у воркера
    broker = RabbitBroker(settings.rabbitmq_url)
    
    # 2. Відкриваємо з'єднання (воркер робить це автоматично, а тут ми маємо викликати явно)
    await broker.connect()

    print("Відправка тестового повідомлення...")

    # 3. Публікуємо повідомлення в чергу
    await broker.publish(
        {
            "email": "shevamax.ua@gmail.com",
            "token": "super-secret-token-123",
            "action": "reset_password"
        },
        queue="email_queue"
    )

    print("Повідомлення успішно відправлено!")
    
    # 4. Закриваємо з'єднання
    await broker.close()


# Оскільки FastStream працює асинхронно, запускаємо скрипт через asyncio
if __name__ == "__main__":
    asyncio.run(main())