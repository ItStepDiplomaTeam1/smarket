from faststream import FastStream
from faststream.rabbit import RabbitBroker, RabbitQueue
from faststream.exceptions import RejectMessage

# Імпортуємо наші налаштування та схеми з інших файлів
from src.config import settings
from src.schemas import EmailEvent
from src.services import process_email_sending


# 1.1 Створюємо брокер (з'єднання з RabbitMQ)
broker = RabbitBroker(url=settings.rabbitmq_url)

# 1.2 Створюємо FastStream і передаємо йому брокер
app = FastStream(broker=broker)

# 2.1 Створюємо чергу для помилок (Мертва черга)
dlq = RabbitQueue("email_dead_letter_queue")

# 2.2 Налаштовуємо основну чергу
main_queue = RabbitQueue(
    "email_queue",
    arguments={"x-dead-letter-exchange": "", "x-dead-letter-routing-key": dlq.name},
)


@broker.subscriber("email_queue")
async def handle_email(event: EmailEvent):
    # FastStream вже перетворив JSON з черги на об'єкт EmailEvent

    print("=" * 40)
    print(f"[!] СТАРТ ОБРОБКИ: {event.action} -> {event.email}")

    # Викликаємо функцію відправки.
    # Якщо тут виникне помилка (raise e), FastStream автоматично зробить
    # Nack (Negative Acknowledgement) і повідомлення повернеться в чергу.

    try:
        await process_email_sending(
            email_to=event.email, token=event.token, action=event.action
        )
        print("[!] ЗАВДАННЯ ВИКОНАНО")

    except Exception as e:
        print(f"[X] КРИТИЧНА ПОМИЛКА: {e}")

        # RejectMessage - це спеціальна помилка FastStream.
        # Вона каже брокеру зробити NACK (відхилити) і НЕ повертати в поточну чергу.
        # Оскільки ми налаштували DLQ вище, RabbitMQ автоматично перекине його туди.

        raise RejectMessage()

    print("=" * 40)
