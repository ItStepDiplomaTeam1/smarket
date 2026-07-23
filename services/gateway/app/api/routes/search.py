from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings

router = APIRouter()


@router.api_route(
    "",
    methods=["GET"],
    include_in_schema=False,
)
async def proxy_to_search_root(request: Request):
    return await proxy_to_search(request, "")


@router.api_route(
    "/{path:path}",
    methods=["GET"],
    include_in_schema=False,
)
async def proxy_to_search(request: Request, path: str):
    """Проксі до search_service (Rust / Axum / Meilisearch).

    Назовні проксіюються лише GET-запити. Індексація та видалення документів
    є внутрішніми операціями ETL і ніколи не повинні проходити через Gateway.
    """
    client: httpx.AsyncClient = request.app.state.http_client

    target_url = f"{settings.SEARCH_SERVICE_URL}/api/v1/{path}"

    headers = dict(request.headers)
    for sensitive_header in ("host", "authorization", "cookie", "x-user-id", "x-user-role"):
        headers.pop(sensitive_header, None)

    try:
        req = client.build_request(
            method="GET",
            url=target_url,
            headers=headers,
            params=request.query_params,
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
