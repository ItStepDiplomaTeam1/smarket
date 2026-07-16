from fastapi import APIRouter, Request, Depends, Response
from fastapi.responses import JSONResponse, StreamingResponse
import httpx

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


def _error_response(error: str, detail: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": error, "detail": detail},
    )


@router.post("/summarize-plan", include_in_schema=False)
async def proxy_summarize_plan(
    request: Request,
):
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.AGENT_SERVICE_URL}/agent/summarize-plan"

    headers = dict(request.headers)
    headers.pop("host", None)

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

    headers = dict(request.headers)
    headers.pop("host", None)

    headers["X-User-Id"] = str(token_payload.get("sub"))

    try:
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=request.stream(),
            timeout=120.0,
        )
        response = await client.send(req, stream=True)

        # If upstream returned an error status, read and forward the body
        if response.status_code >= 400:
            body = await response.aread()
            await response.aclose()
            return Response(
                status_code=response.status_code,
                content=body,
                media_type="application/json",
            )

        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers),
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
