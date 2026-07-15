import os
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
from loguru import logger

# Retrieve SMTP settings
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

EMAIL_ENABLED = all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS])

if not EMAIL_ENABLED:
    logger.warning(
        "📧 Email service is DISABLED (missing configuration). "
        "OTP codes and receipts will be printed to console/logs instead."
    )


async def send_email(to_email: str, subject: str, html_content: str, text_content: str) -> None:
    """Asynchronously dispatch an email to the recipient or print to console if disabled."""
    if not EMAIL_ENABLED:
        logger.info(
            f"📧 Email SKIPPED (SMTP not configured)\n"
            f"   To: {to_email}\n"
            f"   Subject: {subject}\n"
            f"   Text Content: {text_content}"
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Smarket <{SMTP_USER}>"
    msg["To"] = to_email
    msg["Auto-Submitted"] = "auto-generated"
    msg["X-Auto-Response-Suppress"] = "All"

    part1 = MIMEText(text_content, "plain", "utf-8")
    part2 = MIMEText(html_content, "html", "utf-8")

    msg.attach(part1)
    msg.attach(part2)

    try:
        port = int(SMTP_PORT) if SMTP_PORT else 587
        # Connect and send via STARTTLS
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=port,
            username=SMTP_USER,
            password=SMTP_PASS,
            use_tls=False,
            start_tls=True,
        )
        logger.info(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}")


async def send_otp_email(to_email: str, otp_code: str) -> None:
    """Read OTP template, perform replacement, and send verification email."""
    subject = "Smarket: Код підтвердження"
    template_path = Path(__file__).parent.parent.parent / "templates" / "misc" / "email-letter.html"

    if not EMAIL_ENABLED:
        logger.info(f"🔐 OTP Code for {to_email}: {otp_code}")
    else:
        logger.info(f"🔐 OTP Code generated for {to_email}")

    try:
        with open(template_path, "r", encoding="utf-8") as f:
            html_content = f.read()
    except FileNotFoundError:
        logger.warning(f"Email template not found at {template_path}. Falling back to default layout.")
        html_content = f"<h1>Код: {otp_code}</h1>"

    html_body = html_content.replace("{{ code }}", str(otp_code))
    text_body = (
        f"Вітаємо!\n\n"
        f"Ваш одноразовий код підтвердження (OTP) для Smarket: {otp_code}\n\n"
        f"Цей код є дійсним протягом короткого часу. Не повідомляйте його стороннім особам.\n\n"
        f"---\n"
        f"Це автоматичне повідомлення від Smarket. Будь ласка, не відповідайте на нього."
    )

    await send_email(to_email, subject, html_body, text_body)


async def send_receipt_email(to_email: str, payment_data: dict) -> None:
    """Send payment receipt email."""
    reference = payment_data.get("reference", "")
    subject = f"Smarket: Receipt for {reference}"
    amount = payment_data.get("amount", "")
    payment_id = payment_data.get("payment_id", "")
    
    html_body = (
        f"<h1>Payment Receipt</h1>"
        f"<p>Reference: {reference}</p>"
        f"<p>Amount: {amount}</p>"
        f"<p>Payment ID: {payment_id}</p>"
    )
    text_body = f"Payment Receipt\nReference: {reference}\nAmount: {amount}\nPayment ID: {payment_id}"
    
    await send_email(to_email, subject, html_body, text_body)


async def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Send a password reset link to the user."""
    subject = "Smarket: Скидання пароля"
    html_body = (
        f"<h2>Скидання пароля</h2>"
        f"<p>Ви запросили скидання пароля для вашого облікового запису на Smarket.</p>"
        f"<p>Перейдіть за посиланням нижче, щоб встановити новий пароль:</p>"
        f"<p><a href='{reset_link}'>{reset_link}</a></p>"
        f"<p>Це посилання є дійсним протягом 15 хвилин.</p>"
    )
    text_body = f"Скидання пароля\n\nПерейдіть за посиланням нижче, щоб встановити новий пароль:\n{reset_link}\n\nПосилання дійсне протягом 15 хвилин."
    await send_email(to_email, subject, html_body, text_body)


