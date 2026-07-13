import resend
import asyncio
import os
from jinja2 import Environment, FileSystemLoader
from src.config import settings

# Налаштовуємо Jinja2 для пошуку шаблонів у папці src/templates
current_dir = os.path.dirname(os.path.abspath(__file__))
templates_dir = os.path.join(current_dir, "templates")
jinja_env = Environment(loader=FileSystemLoader(templates_dir))

# Передаємо ключ з наших налаштувань в бібліотеку Resend
resend.api_key = settings.resend_api_key


def _send_email(email_to: str, token: str, action: str):
    """Синхронна функція для відправки листа через Resend API."""

    # 1. Визначаємо шаблон та тему залежно від дії
    if action == "activation":
        subject = "Активація акаунту"
        # Для активації можна створити окремий файл activation.html пізніше
        template_name = "reset_password.html"
    elif action == "reset_password":
        subject = "Відновлення паролю"
        template_name = "reset_password.html"
    elif action == "share_cart":
        subject = "З вами поділилися кошиком в SMarket!"
        template_name = "share_cart.html"
    else:
        raise ValueError(f"Невідома дія: {action}")

    # 2. Завантажуємо шаблон і рендеримо його з токеном та URL фронтенду
    template = jinja_env.get_template(template_name)
    html_content = template.render(
        token=token,
        frontend_url=settings.frontend_url.rstrip("/")
    )

    # 3. Формуємо параметри для Resend
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
