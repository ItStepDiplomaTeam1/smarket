from slowapi import Limiter
from slowapi.util import get_remote_address
from services.api.plugins.security.secrets.load_secret import get_secret


redis_uri = get_secret("REDIS_URL")

auth_limiter = Limiter(
    key_func=get_remote_address,
    strategy="moving-window",
    storage_uri=redis_uri,
    key_prefix="rl:auth",
)