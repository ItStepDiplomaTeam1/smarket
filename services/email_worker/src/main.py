from faststream import FastStream
from faststream.rabbit import RabbitBroker

# Імпортуємо наші налаштування та схеми з інших файлів
from src.config import settings
from src.schemas import EmailEvent

# Додаємо імпорт нашого сервісу
from src.services import process_email_sending


# 1. Створюємо брокер (з'єднання з RabbitMQ)
broker = RabbitBroker(url=settings.rabbitmq_url)

# 2. Створюємо FastStream і передаємо йому брокер
app = FastStream(broker=broker)

# 3. Декоратор, який підписує функцію на конкретну чергу
@broker.subscriber("email_queue")
async def handle_email(event: EmailEvent):
    # FastStream вже перетворив JSON з черги на об'єкт EmailEvent

    print("="*40)
    print(f"[!] СТАРТ ОБРОБКИ: {event.action} -> {event.email}")

    # Викликаємо функцію відправки. 
    # Якщо тут виникне помилка (raise e), FastStream автоматично зробить
    # Nack (Negative Acknowledgement) і повідомлення повернеться в чергу.

    await process_email_sending(
        email_to=event.email,
        token=event.token,
        action=event.action
    )
    
    print("[!] ЗАВДАННЯ ВИКОНАНО")
    print("="*40)