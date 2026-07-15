from unittest.mock import AsyncMock

import pytest

from services.auth_service.plugins.security import email_sender


@pytest.mark.asyncio
async def test_send_email_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    # Force EMAIL_ENABLED to True and configure SMTP settings
    monkeypatch.setattr(email_sender, "EMAIL_ENABLED", True)
    monkeypatch.setattr(email_sender, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(email_sender, "SMTP_PORT", "587")
    monkeypatch.setattr(email_sender, "SMTP_USER", "user@example.com")
    monkeypatch.setattr(email_sender, "SMTP_PASS", "password")

    mock_send = AsyncMock()
    monkeypatch.setattr("aiosmtplib.send", mock_send)

    await email_sender.send_email(
        to_email="recipient@example.com",
        subject="Test Subject",
        html_content="<h1>Test</h1>",
        text_content="Test",
    )

    mock_send.assert_awaited_once()


@pytest.mark.asyncio
async def test_send_email_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    # Force EMAIL_ENABLED to False
    monkeypatch.setattr(email_sender, "EMAIL_ENABLED", False)

    mock_send = AsyncMock()
    monkeypatch.setattr("aiosmtplib.send", mock_send)

    await email_sender.send_email(
        to_email="recipient@example.com",
        subject="Test Subject",
        html_content="<h1>Test</h1>",
        text_content="Test",
    )

    mock_send.assert_not_awaited()


@pytest.mark.asyncio
async def test_send_otp_email_calls_dispatcher(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_send_email = AsyncMock()
    monkeypatch.setattr(email_sender, "send_email", mock_send_email)

    await email_sender.send_otp_email("recipient@example.com", "123456")

    # Verify send_email wrapper is called
    mock_send_email.assert_awaited_once()
    args, kwargs = mock_send_email.call_args
    # Check recipient, subject, and text body contain the code
    assert args[0] == "recipient@example.com"
    assert args[1] == "Smarket: Код підтвердження"
    assert "123456" in args[2]  # HTML content
    assert "123456" in args[3]  # Text content


@pytest.mark.asyncio
async def test_send_receipt_email_calls_dispatcher(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_send_email = AsyncMock()
    monkeypatch.setattr(email_sender, "send_email", mock_send_email)

    payment_data = {
        "amount": "150.00",
        "reference": "REF999888",
        "card_mask": "4111********1111",
        "payment_id": "pay_xyz",
    }
    await email_sender.send_receipt_email("recipient@example.com", payment_data)

    # Verify send_email wrapper is called
    mock_send_email.assert_awaited_once()
    args, kwargs = mock_send_email.call_args
    assert args[0] == "recipient@example.com"
    assert "REF999888" in args[1]  # Subject
    assert "150.00" in args[2]  # HTML content contains amount
    assert "REF999888" in args[2]  # HTML content contains reference
    assert "pay_xyz" in args[2]  # HTML content contains payment ID
