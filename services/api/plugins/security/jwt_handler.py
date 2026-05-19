import jwt
from datetime import datetime, timedelta, timezone
from services.api.plugins.security.secrets.load_secret import get_secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

def create_access_token(user_id: str, role: str) -> str:
    secret_key = get_secret("SECRET_KEY")
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)
