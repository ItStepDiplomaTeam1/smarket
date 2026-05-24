import uuid
import jwt
from datetime import datetime, timedelta, timezone

from services.api.plugins.security.secrets.load_secret import get_secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


class JWTExpiredError(Exception):
    pass


class JWTInvalidError(Exception):
    pass


def create_access_token(user_id: str, role: str) -> str:
    secret_key = get_secret("SECRET_KEY")
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": now,
        "jti": str(uuid.uuid4()),
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def create_refresh_token(user_id: str, role: str) -> str:
    secret_key = get_secret("SECRET_KEY")
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "type": "refresh",
        "iat": now,
        "jti": str(uuid.uuid4()),
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    secret_key = get_secret("SECRET_KEY")
    try:
        return jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise JWTExpiredError("Token has expired")
    except jwt.InvalidTokenError:
        raise JWTInvalidError("Invalid token")

