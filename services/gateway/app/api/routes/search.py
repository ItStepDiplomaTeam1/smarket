from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings

router = APIRouter()


@router.api_route(
    "/{path:path}",
    methods=["GET", "POST", "DELETE"],
    include_in_schema=False,
)
async def proxy_to_search(request: Request, path: str):
    """Проксі до search_service (Rust / Axum / Meilisearch).

    Усі запити до /api/v1/search/* пробрасуємо напряму.
    Аутентифікація не потрібна — пошук є публічним read-only endpoint.
    """
    client: httpx.AsyncClient = request.app.state.http_client

    target_url = f"{settings.SEARCH_SERVICE_URL}/api/v1/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)

    try:
        req = client.build_request(
            method=request.method,
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
        raise HTTPException(
            status_code=503,
            detail="Search Service недоступний",
        )
