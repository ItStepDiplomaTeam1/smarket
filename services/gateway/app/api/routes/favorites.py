from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


@router.api_route(
    "",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    include_in_schema=False,
)
async def proxy_to_favorites_root(
    request: Request,
    token_payload: dict = Depends(verify_jwt),
):
    return await proxy_to_favorites(request, "", token_payload)


@router.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    include_in_schema=False,
)
async def proxy_to_favorites(
    request: Request,
    path: str,
    token_payload: dict = Depends(verify_jwt),
):
    client: httpx.AsyncClient = request.app.state.http_client
    # favorites endpoints live in cart_service
    target_url = f"{settings.CART_SERVICE_URL}/favorites/{path}"

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
        )
        response = await client.send(req, stream=True)
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers),
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Сервіс улюблених недоступний")
