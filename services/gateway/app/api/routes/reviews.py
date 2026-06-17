from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


# -------------------------------------------------------
#  GET — публічний доступ (перегляд відгуків без JWT)
# -------------------------------------------------------
@router.api_route(
    "/product/{product_id}",
    methods=["GET"],
    include_in_schema=False,
)
async def proxy_reviews_public(request: Request, product_id: int):
    """Проксі GET-запитів до reviews_service (публічний доступ)."""
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.REVIEWS_SERVICE_URL}/api/v1/reviews/product/{product_id}"

    headers = dict(request.headers)
    headers.pop("host", None)

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
        raise HTTPException(status_code=503, detail="Сервіс відгуків недоступний")


# -------------------------------------------------------
#  POST / PUT / DELETE — потрібна авторизація (JWT)
# -------------------------------------------------------
@router.api_route(
    "/{path:path}",
    methods=["POST", "PUT", "DELETE"],
    include_in_schema=False,
)
async def proxy_reviews_protected(
    request: Request,
    path: str,
    token_payload: dict = Depends(verify_jwt),
):
    """Проксі мутаційних запитів до reviews_service (потрібен JWT)."""
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.REVIEWS_SERVICE_URL}/api/v1/reviews/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)

    # Передаємо user_id та user_name з токена в query-параметри,
    # як того очікує reviews_service
    user_id = str(token_payload.get("sub"))
    user_name = str(token_payload.get("name", "Користувач"))

    # Додаємо user_id у query params (reviews_service очікує це)
    params = dict(request.query_params)
    params["user_id"] = user_id
    params["user_name"] = user_name

    try:
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=params,
            content=request.stream(),
        )
        response = await client.send(req, stream=True)
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers),
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Сервіс відгуків недоступний")
