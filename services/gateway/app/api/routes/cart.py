from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import Response, StreamingResponse
import httpx

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


@router.get("/shared/{cart_id}", include_in_schema=False)
async def proxy_public_shared_cart(
    request: Request,
    cart_id: str,
):
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.CART_SERVICE_URL}/cart/shared/{cart_id}"
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
        response_headers = dict(response.headers)
        response_headers["Cache-Control"] = "no-store"
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=response_headers,
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Сервіс кошика недоступний")


@router.get("/receipts/{share_token}", include_in_schema=False)
async def proxy_public_receipt(
    request: Request,
    share_token: str,
):
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.CART_SERVICE_URL}/cart/receipts/{share_token}"

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
        response_headers = dict(response.headers)
        response_headers["Cache-Control"] = "no-store"
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=response_headers,
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Сервіс кошика недоступний")


# Усі запити до /cart/* вимагають наявності токена!
@router.api_route(
    "",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    include_in_schema=False,
)
async def proxy_to_cart_root(
    request: Request,
    token_payload: dict = Depends(verify_jwt),
):
    return await proxy_to_cart(request, "", token_payload)


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
    for sensitive_header in ("host", "authorization", "cookie", "x-user-id", "x-user-role"):
        headers.pop(sensitive_header, None)

    # Оскільки Gateway вже перевірив токен, ми просто передаємо ID користувача.
    # Cart Service буде працювати з цим X-User-Id і навіть не знатиме про існування JWT.

    headers["X-User-Id"] = str(token_payload.get("sub"))

    try:
        body_content = (
            b"" if request.method in ["GET", "HEAD", "DELETE"] else request.stream()
        )
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=body_content,
        )
        # Cart responses are small JSON documents. Buffering them keeps read
        # failures inside this handler so the gateway can return a CORS-enabled
        # error instead of failing later while StreamingResponse is iterating.
        response = await client.send(req)
        response_headers = {
            key: value
            for key, value in response.headers.items()
            if key.lower()
            not in {
                "connection",
                "content-encoding",
                "content-length",
                "transfer-encoding",
            }
        }
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers,
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Сервіс кошика не відповів вчасно")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Сервіс кошика недоступний")
    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Помилка під час отримання відповіді сервісу кошика",
        )
