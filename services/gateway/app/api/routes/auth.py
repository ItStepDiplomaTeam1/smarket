from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


async def proxy_request(request: Request, path: str):
    """Допоміжна функція для проксування запитів до Auth Service."""
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.AUTH_SERVICE_URL}/auth/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)

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


# ---------------------------------------------------------------
#  Публічні роути (без токена) — проксуємо напряму до auth_service
# ---------------------------------------------------------------

@router.post("/register")
async def register(request: Request):
    """Реєстрація нового користувача. Повертає access_token + встановлює httpOnly cookie з refresh_token."""
    return await proxy_request(request, "register")


@router.post("/login")
async def login(request: Request):
    """Вхід за email/password. Повертає access_token + встановлює httpOnly cookie з refresh_token."""
    return await proxy_request(request, "login")


@router.post("/refresh")
async def refresh(request: Request):
    """Оновлення access_token за допомогою refresh_token з httpOnly cookie."""
    return await proxy_request(request, "refresh")


@router.post("/logout")
async def logout(request: Request):
    """Вихід із системи — видаляє refresh_token cookie."""
    return await proxy_request(request, "logout")


@router.post("/oauth/google")
async def google_oauth(request: Request):
    """Google OAuth — верифікація Google ID Token і видача системних JWT."""
    return await proxy_request(request, "oauth/google")


# ---------------------------------------------------------------
#  Захищені роути (вимагають валідний Bearer токен)
#  Gateway перевіряє JWT локально (без зайвого мережевого запиту),
#  а потім проксує до auth_service з оригінальним Authorization заголовком.
# ---------------------------------------------------------------

@router.get("/me")
async def get_current_user(
    request: Request,
    _: dict = Depends(verify_jwt),  # локальна перевірка токена — відсікаємо невалідні запити
):
    """
    Повертає дані поточного користувача з БД через auth_service.
    Gateway спочатку валідує JWT локально (швидко, без мережі),
    потім проксує до /auth/me auth_service для отримання актуальних даних з БД.
    """
    return await proxy_request(request, "me")


@router.get("/users/{user_id}")
async def get_user_by_id(request: Request, user_id: str):
    """Отримати інформацію про користувача за його ID (включаючи ім'я)."""
    return await proxy_request(request, f"users/{user_id}")

