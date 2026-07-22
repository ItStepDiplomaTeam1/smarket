from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse, StreamingResponse
import httpx
import uuid
from starlette.background import BackgroundTask

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


def _error_response(error: str, detail: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": error, "detail": detail},
    )


def _proxy_headers(request: Request) -> dict[str, str]:
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("x-request-id", None)
    headers["X-Request-Id"] = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    return headers


def _safe_agent_error(status_code: int) -> JSONResponse:
    if status_code == 401:
        return _error_response("agent_auth_required", "Потрібно увійти в акаунт", 401)
    if status_code == 403:
        return _error_response("agent_action_forbidden", "Дію не дозволено", 403)
    if status_code == 409:
        return _error_response(
            "agent_action_expired",
            "Дія вже виконана або термін підтвердження минув",
            409,
        )
    if status_code in {400, 422}:
        return _error_response("agent_invalid_request", "Перевірте запит до Zephyros", status_code)
    return _error_response(
        "agent_error",
        "Zephyros тимчасово не зміг виконати запит",
        status_code,
    )


@router.post("/summarize-plan", include_in_schema=False)
async def proxy_summarize_plan(
    request: Request,
):
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.AGENT_SERVICE_URL}/agent/summarize-plan"

    headers = _proxy_headers(request)

    try:
        req = client.build_request(
            method="POST",
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=request.stream(),
        )
        response = await client.send(req, stream=True)
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers),
            background=BackgroundTask(response.aclose),
        )
    except httpx.ConnectError:
        return _error_response("agent_unavailable", "Сервіс агента недоступний", 503)


@router.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    include_in_schema=False,
)
async def proxy_to_agent(
    request: Request,
    path: str,
    token_payload: dict = Depends(verify_jwt),
):
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.AGENT_SERVICE_URL}/agent/{path}"

    headers = _proxy_headers(request)

    headers["X-User-Id"] = str(token_payload.get("sub"))

    try:
        body_content = b"" if request.method in ["GET", "HEAD", "DELETE"] else request.stream()
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=body_content,
            timeout=35.0,
        )
        response = await client.send(req, stream=True)

        # If upstream returned an error status, read and forward the body
        if response.status_code >= 400:
            await response.aread()
            await response.aclose()
            return _safe_agent_error(response.status_code)

        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers),
            background=BackgroundTask(response.aclose),
        )
    except httpx.ReadTimeout:
        return _error_response("agent_timeout", "Сервіс агента не відповів вчасно", 504)
    except httpx.ConnectTimeout:
        return _error_response("agent_timeout", "Сервіс агента не відповів вчасно", 504)
    except httpx.ConnectError:
        return _error_response("agent_unavailable", "Сервіс агента недоступний", 503)
    except (httpx.WriteError, httpx.PoolTimeout):
        return _error_response("agent_error", "Помилка з'єднання з агентом", 502)
    except httpx.HTTPError:
        return _error_response("agent_error", "Помилка з'єднання з агентом", 502)
