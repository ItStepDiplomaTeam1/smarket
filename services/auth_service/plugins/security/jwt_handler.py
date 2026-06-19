import uuid
from datetime import UTC, datetime, timedelta
from functools import lru_cache

import jwt

from services.auth_service.plugins.security.secrets.load_secret import get_secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


class JWTExpiredError(Exception):
    pass


class JWTInvalidError(Exception):
    pass


@lru_cache
def _get_secret_key() -> str:
    return get_secret("SECRET_KEY")


def create_access_token(user_id: str, role: str, email: str) -> str:
    now = datetime.now(UTC)
    username = email.split("@")[0] if "@" in email else email
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "name": username,
        "type": "access",
        "iat": now,
        "jti": str(uuid.uuid4()),
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, _get_secret_key(), algorithm=ALGORITHM)


def create_refresh_token(user_id: str, role: str, email: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "type": "refresh",
        "iat": now,
        "jti": str(uuid.uuid4()),
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, _get_secret_key(), algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, _get_secret_key(), algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError as err:
        raise JWTExpiredError("Token has expired") from err
    except jwt.InvalidTokenError as err:
        raise JWTInvalidError("Invalid token") from err
