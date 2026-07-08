import hashlib
import hmac
import time
from typing import Dict, Any
from loguru import logger
from services.auth_service.plugins.security.secrets.load_secret import get_secret


def verify_telegram_auth(data: Dict[str, Any], bot_token: str = None) -> bool:
    """
    Verifies authentication data received from the Telegram Login Widget.
    Spec: https://core.telegram.org/widgets/login
    """
    if bot_token is None:
        try:
            bot_token = get_secret("TELEGRAM_BOT_TOKEN")
        except ValueError:
            logger.error("TELEGRAM_BOT_TOKEN environment variable not set")
            return False

    received_hash = data.get("hash")
    if not received_hash:
        logger.warning("Telegram auth validation failed: no hash provided")
        return False

    # Check freshness of auth_date (must be within last 24 hours)
    auth_date = data.get("auth_date")
    if not auth_date:
        logger.warning("Telegram auth validation failed: no auth_date provided")
        return False

    try:
        auth_timestamp = int(auth_date)
    except ValueError:
        logger.warning(f"Telegram auth validation failed: invalid auth_date format '{auth_date}'")
        return False

    current_timestamp = int(time.time())
    if current_timestamp - auth_timestamp > 86400:  # 24 hours
        logger.warning(f"Telegram auth validation failed: auth_date '{auth_date}' is older than 24 hours (current: {current_timestamp})")
        return False

    # Prepare data check string: keys sorted alphabetically, key=value joined by newlines
    # The 'hash' parameter must be omitted
    data_to_check = {k: v for k, v in data.items() if k != "hash" and v is not None}
    sorted_keys = sorted(data_to_check.keys())
    data_check_string = "\n".join(f"{k}={data_to_check[k]}" for k in sorted_keys)

    # Secret key is SHA256 of the bot token
    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()

    # Calculate HMAC-SHA256 signature of data_check_string using the secret_key
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        logger.warning("Telegram auth validation failed: signature mismatch")
        return False

    return True
