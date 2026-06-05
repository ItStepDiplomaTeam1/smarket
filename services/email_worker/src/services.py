import resend
import asyncio
from src.config import settings

# Передаємо ключ з наших налаштувань в бібліотеку Resend
resend.api_key = settings.resend_api_key

def _send_email(email_to: str, token: str, action: str):
    """Синхронна функція для відправки листа через Resend API."""

    # Визначаємо тему та текст залежно від дії
    if action == "activation":

        subject = "Активація акаунту"
        # Поки що робимо прості HTML-листи
        html_content = f"<h1>Вітаємо!</h1><p>Ваш токен для активації: <strong>{token}</strong></p>"
    
    elif action == "reset_password":

        subject = "Відновлення паролю"
        html_content = f"<h1>Запит на відновлення паролю</h1><p>Для відновлення використайте токен: <strong>{token}</strong></p>"
   
    else:
        raise ValueError(f"Невідома дія: {action}")
    
    # Важливо: Для тестового акаунту Resend дозволяє відправляти листи 
    # ТІЛЬКИ на ту пошту, на яку ти зареєстрував акаунт в Resend!
    # Відправник має бути 'onboarding@resend.dev'
    params: resend.Emails.SendParams = {
        "from": "onboarding@resend.dev",
        "to": [email_to], 
        "subject": subject,
        "html": html_content,
    }

    # Виконуємо відправку
    response = resend.Emails.send(params)
    return response

async def process_email_sending(email_to: str, token: str, action: str):
    """Асинхронна обгортка для нашого воркера."""

    try:
        response = await asyncio.to_thread(_send_email, email_to, token, action)
        print(f"✅ Лист успішно відправлено! ID: {response.get('id')}")
    except Exception as e:
        print(f"❌ Помилка під час відправки через Resend: {e}")
        # Обов'язково прокидаємо помилку далі!
        # Якщо ми її приховаємо, RabbitMQ подумає, що все добре, і видалить повідомлення з черги
        raise e