from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


# Усі запити до /cart/* вимагають наявності токена!
@router.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    include_in_schema=False,
)
async def proxy_to_cart(
    request: Request,
    path: str,
    token_payload: dict = Depends(verify_jwt),
):
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.CART_SERVICE_URL}/cart/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)

    # Оскільки Gateway вже перевірив токен, ми просто передаємо ID користувача.
    # Cart Service буде працювати з цим X-User-Id і навіть не знатиме про існування JWT.

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
        raise HTTPException(status_code=503, detail="Сервіс кошика недоступний")
