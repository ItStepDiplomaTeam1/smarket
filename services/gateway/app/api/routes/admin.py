from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import jwt

from app.api.core.config import settings

router = APIRouter()

_ADMIN_ROLES = {"admin", "superadmin"}

# Service names returned when the product_service is unreachable
_FALLBACK_SERVICES = ["PostgreSQL", "Redis", "Meilisearch", "RabbitMQ"]


def _verify_admin_token(request: Request) -> dict:
    """
    Decode and validate the JWT from the Authorization header.
    Raises 401/403 if the token is missing, invalid, or not an admin.
    Returns the decoded payload on success.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Авторизація обов'язкова")

    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Сесія застаріла, увійдіть знову")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Невалідний токен доступу")

    if payload.get("role") not in _ADMIN_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Доступ заборонено. Потрібні права адміністратора.",
        )

    return payload


async def _proxy_to_auth(request: Request, path: str, payload: dict) -> StreamingResponse:
    """Forward the request to auth_service, enriching headers with user context."""
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.AUTH_SERVICE_URL}/admin/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)
    # Inject extracted user context so auth_service can trust it without re-decoding
    headers["X-User-Id"] = str(payload.get("sub", ""))
    headers["X-User-Role"] = str(payload.get("role", ""))

    try:
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=await request.body(),
        )
        response = await client.send(req, stream=True)
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers),
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Auth service unavailable")


# ── Admin Routes ──────────────────────────────────────────────────────────────


@router.get("/recent-users")
async def get_recent_users(request: Request):
    """
    Returns the most recently registered users.
    Requires admin role — validated locally at the Gateway before proxying.
    """
    payload = _verify_admin_token(request)
    return await _proxy_to_auth(request, "recent-users", payload)


@router.get("/system-status")
async def get_system_status(request: Request):
    """
    Returns real-time operational status of all infrastructure services.
    Probes are performed by product_service (internal network access).
    Requires admin role — validated locally at the Gateway.
    Always returns 200 with "Помилка" for unreachable services.
    """
    _verify_admin_token(request)

    client: httpx.AsyncClient = request.app.state.http_client
    probe_url = f"{settings.PRODUCT_SERVICE_URL}/api/v1/internal/health-check"

    try:
        response = await client.get(probe_url, timeout=15.0)
        response.raise_for_status()
        service_statuses: dict = response.json()
    except Exception:
        # Product service is unreachable — mark all its databases as failed
        service_statuses = {name: "Помилка" for name in _FALLBACK_SERVICES}

    # Gateway itself is obviously alive if we reached this point
    service_statuses["API Gateway"] = "Працює"

    return JSONResponse(content=service_statuses)

