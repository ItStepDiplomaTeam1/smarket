import pytest
import resend
from unittest.mock import AsyncMock, MagicMock
from faststream.exceptions import RejectMessage

# Import schemas and functions
from src.schemas import EmailEvent
from src.services import process_email_sending
from src.main import handle_email, handle_health_check

@pytest.mark.asyncio
async def test_process_email_sending_success(monkeypatch):
    mock_send = MagicMock(return_value={"id": "email-123"})
    monkeypatch.setattr("resend.Emails.send", mock_send)
    
    await process_email_sending(
        email_to="test@example.com",
        token="test-token-xyz",
        action="reset_password"
    )
    
    assert mock_send.call_count == 1
    call_args = mock_send.call_args[0][0]
    assert call_args["to"] == ["test@example.com"]
    assert "test-token-xyz" in call_args["html"]
    assert call_args["subject"] == "Відновлення паролю"

@pytest.mark.asyncio
async def test_process_email_sending_failed(monkeypatch):
    # Mock Resend to throw exception
    def mock_send_fail(params):
        raise Exception("API failure")
    monkeypatch.setattr("resend.Emails.send", mock_send_fail)
    
    with pytest.raises(Exception) as excinfo:
        await process_email_sending(
            email_to="test@example.com",
            token="test-token-xyz",
            action="reset_password"
        )
    assert "API failure" in str(excinfo.value)

@pytest.mark.asyncio
async def test_handle_email_rejects_on_failure(monkeypatch):
    # Mock process_email_sending to raise Exception
    mock_failed_process = AsyncMock(side_effect=Exception("Failed processing"))
    monkeypatch.setattr("src.main.process_email_sending", mock_failed_process)
    
    event = EmailEvent(
        email="test@example.com",
        token="test-token-xyz",
        action="reset_password"
    )
    
    # Verify that RejectMessage is raised to route the message to DLQ
    with pytest.raises(RejectMessage):
        await handle_email(event)

@pytest.mark.asyncio
async def test_health_check_endpoint():
    mock_reader = MagicMock()
    mock_writer = MagicMock()
    
    mock_writer.write = MagicMock()
    mock_writer.drain = AsyncMock()
    mock_writer.close = MagicMock()
    mock_writer.wait_closed = AsyncMock()
    
    await handle_health_check(mock_reader, mock_writer)
    
    # Assert writer.write was called with OK status response
    assert mock_writer.write.call_count == 1
    written_bytes = mock_writer.write.call_args[0][0]
    assert b"200 OK" in written_bytes
    assert b'{"status":"ok"}' in written_bytes
