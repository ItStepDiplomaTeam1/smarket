import hashlib
import hmac
import time
from fastapi.testclient import TestClient
from services.auth_service.main import app
from services.auth_service.plugins.security.telegram_validator import verify_telegram_auth

client = TestClient(app)

BOT_TOKEN = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"


def _calc_hash(data: dict, token: str) -> str:
    data_to_check = {k: v for k, v in data.items() if k != "hash" and v is not None}
    sorted_keys = sorted(data_to_check.keys())
    data_check_string = "\n".join(f"{k}={data_to_check[k]}" for k in sorted_keys)
    secret_key = hashlib.sha256(token.encode("utf-8")).digest()
    return hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()


def test_telegram_validator_valid() -> None:
    payload = {
        "id": 123456,
        "first_name": "John",
        "username": "john_doe",
        "auth_date": int(time.time()),
    }
    payload["hash"] = _calc_hash(payload, BOT_TOKEN)
    assert verify_telegram_auth(payload, BOT_TOKEN) is True


def test_telegram_validator_expired() -> None:
    payload = {
        "id": 123456,
        "first_name": "John",
        "username": "john_doe",
        "auth_date": int(time.time()) - 90000,  # older than 24 hours
    }
    payload["hash"] = _calc_hash(payload, BOT_TOKEN)
    assert verify_telegram_auth(payload, BOT_TOKEN) is False


def test_telegram_validator_invalid_signature() -> None:
    payload = {
        "id": 123456,
        "first_name": "John",
        "username": "john_doe",
        "auth_date": int(time.time()),
    }
    payload["hash"] = "wrong_hash"
    assert verify_telegram_auth(payload, BOT_TOKEN) is False


def test_telegram_login_endpoint_invalid_sig() -> None:
    payload = {
        "id": 123456,
        "first_name": "John",
        "username": "john_doe",
        "auth_date": int(time.time()),
        "hash": "wrong_hash",
    }
    response = client.post("/auth/oauth/telegram", json=payload)
    assert response.status_code == 401
    assert "Invalid Telegram signature" in response.json()["detail"]
