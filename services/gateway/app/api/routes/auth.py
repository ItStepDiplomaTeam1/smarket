from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


def require_trusted_browser_origin(request: Request) -> None:
    """Reject untrusted browser POSTs that are not in allowed_cors_origins."""
    origin = request.headers.get("origin")
    if origin is not None:
        clean_origin = origin.rstrip("/")
        if clean_origin not in settings.allowed_cors_origins and "*" not in settings.allowed_cors_origins:
            raise HTTPException(status_code=403, detail="Untrusted request origin")


async def proxy_request(request: Request, path: str):
    """Допоміжна функція для проксування запитів до Auth Service."""
    client: httpx.AsyncClient = request.app.state.auth_http_client
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
        response_headers = dict(response.headers)
        response_headers["Cache-Control"] = "no-store"
        response_headers["Pragma"] = "no-cache"
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=response_headers,
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Auth service unavailable")


# ---------------------------------------------------------------
#  Публічні роути (без токена) — проксуємо напряму до auth_service
# ---------------------------------------------------------------


@router.post("/register")
async def register(request: Request):
    """Реєстрація нового користувача. Повертає access_token + встановлює httpOnly cookie з refresh_token."""
    require_trusted_browser_origin(request)
    return await proxy_request(request, "register")


@router.post("/register/verify")
async def register_verify(request: Request):
    """Верифікація реєстрації через OTP."""
    require_trusted_browser_origin(request)
    return await proxy_request(request, "register/verify")


@router.post("/login")
async def login(request: Request):
    """Вхід за email/password. Повертає access_token + встановлює httpOnly cookie з refresh_token."""
    require_trusted_browser_origin(request)
    return await proxy_request(request, "login")


@router.post("/refresh")
async def refresh(request: Request):
    """Оновлення access_token за допомогою refresh_token з httpOnly cookie."""
    require_trusted_browser_origin(request)
    return await proxy_request(request, "refresh")


@router.post("/logout")
async def logout(request: Request):
    """Вихід із системи — видаляє refresh_token cookie."""
    require_trusted_browser_origin(request)
    return await proxy_request(request, "logout")


@router.post("/oauth/google")
async def google_oauth(request: Request):
    """Google OAuth — верифікація Google ID Token і видача системних JWT."""
    require_trusted_browser_origin(request)
    return await proxy_request(request, "oauth/google")


@router.post("/telegram")
async def telegram_oauth(request: Request):
    """Telegram OAuth — верифікація Telegram Login Widget даних і видача системних JWT."""
    require_trusted_browser_origin(request)
    return await proxy_request(request, "oauth/telegram")


@router.post("/forgot-password")
async def forgot_password(request: Request):
    """Запит на відновлення пароля."""
    return await proxy_request(request, "forgot-password")


@router.post("/reset-password")
async def reset_password(request: Request):
    """Скидання пароля за токеном."""
    return await proxy_request(request, "reset-password")


# ---------------------------------------------------------------
#  Захищені роути (вимагають валідний Bearer токен)
#  Gateway перевіряє JWT локально (без зайвого мережевого запиту),
#  а потім проксує до auth_service з оригінальним Authorization заголовком.
# ---------------------------------------------------------------


@router.get("/me")
async def get_current_user(
    request: Request,
    _: dict = Depends(
        verify_jwt
    ),  # локальна перевірка токена — відсікаємо невалідні запити
):
    """
    Повертає дані поточного користувача з БД через auth_service.
    Gateway спочатку валідує JWT локально (швидко, без мережі),
    потім проксує до /auth/me auth_service для отримання актуальних даних з БД.
    """
    return await proxy_request(request, "me")


@router.get("/users/{user_id}")
async def get_user_by_id(
    request: Request,
    user_id: str,
    _: dict = Depends(verify_jwt),
):
    """Отримати публічний профіль користувача за ID для авторизованих клієнтів."""
    return await proxy_request(request, f"users/{user_id}")


@router.patch("/password")
async def change_password(
    request: Request,
    _: dict = Depends(verify_jwt),
):
    """Зміна пароля користувача."""
    return await proxy_request(request, "password")


@router.patch("/settings")
async def update_settings(
    request: Request,
    _: dict = Depends(verify_jwt),
):
    """Оновлення налаштувань користувача."""
    return await proxy_request(request, "settings")
