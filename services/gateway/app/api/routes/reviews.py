from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx
import json

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
    headers.pop("content-length", None)
    headers.pop("Content-Length", None)


    # Передаємо user_id та user_name з токена в заголовках X-User-Id та X-User-Name
    user_id = str(token_payload.get("sub"))
    user_name = token_payload.get("name")

    # Якщо user_name відсутній у JWT — пробуємо взяти з тіла запиту (фронтенд може передати)
    if not user_name and request.method in ("POST", "PUT"):
        try:
            body = await request.body()
            if body:
                payload_data = json.loads(body)
                user_name = payload_data.get("user_name")
        except Exception:
            pass

    if not user_name:
        # Резервний варіант: запитуємо інформацію про користувача через auth_service
        try:
            auth_url = f"{settings.AUTH_SERVICE_URL}/auth/users/{user_id}"
            async with httpx.AsyncClient() as http:
                resp = await http.get(auth_url, timeout=2.0)
                if resp.status_code == 200:
                    user_info = resp.json()
                    user_name = user_info.get("username")
        except Exception:
            pass

    if not user_name:
        user_name = "Користувач"

    # Додаємо user_id та user_name у заголовки (reviews_service очікує це)
    headers["X-User-Id"] = user_id
    headers["X-User-Name"] = user_name

    # Прибираємо user_name з тіла запиту, щоб reviews_service не отримав дубль
    if request.method in ("POST", "PUT"):
        try:
            body = await request.body()
            if body:
                payload_data = json.loads(body)
                if "user_name" in payload_data:
                    del payload_data["user_name"]
                    new_body = json.dumps(payload_data).encode()
                else:
                    new_body = body
            else:
                new_body = body
        except Exception:
            new_body = body
    else:
        new_body = await request.body()

    try:
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=new_body,
        )
        response = await client.send(req, stream=True)
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers),
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Сервіс відгуків недоступний")
