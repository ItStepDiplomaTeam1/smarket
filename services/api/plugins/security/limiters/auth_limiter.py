from slowapi import Limiter
from slowapi.util import get_remote_address
from services.api.plugins.security.secrets.load_secret import get_secret


class _LazyLimiter:
    def __init__(self):
        self._limiter = None

    def _get(self):
        if self._limiter is None:
            self._limiter = Limiter(
                key_func=get_remote_address,
                strategy="moving-window",
                storage_uri=get_secret("REDIS_URL"),
                key_prefix="rl:auth",
            )
        return self._limiter

    def limit(self, *args, **kwargs):
        return self._get().limit(*args, **kwargs)


auth_limiter = _LazyLimiter()
