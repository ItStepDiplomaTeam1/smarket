import jwt
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from services.api.plugins.security.secrets.load_secret import get_secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(user_id: str, role: str) -> str:
    secret_key = get_secret("SECRET_KEY")
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def create_refresh_token(user_id: str, role: str) -> str:
    secret_key = get_secret("SECRET_KEY")
    payload = {
        "sub": user_id,
        "role": role,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    secret_key = get_secret("SECRET_KEY")
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
