from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from services.auth_service.plugins.security.secrets.load_secret import get_secret


def get_proxy_client_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()
    return get_remote_address(request)


class _LazyLimiter:
    def __init__(self):
        self._limiter = None

    def _get(self):
        if self._limiter is None:
            self._limiter = Limiter(
                key_func=get_proxy_client_ip,
                strategy="moving-window",
                storage_uri=get_secret("REDIS_URL"),
                key_prefix="rl:auth",
            )
        return self._limiter

    def limit(self, *args, **kwargs):
        return self._get().limit(*args, **kwargs)


auth_limiter = _LazyLimiter()
