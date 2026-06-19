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
            content=request.stream(),
        )
        response = await client.send(req, stream=True)
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers),
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Auth service unavailable")


# 1. Захищений роут: вимагає токен
@router.get("/me")
async def get_current_user(token_payload: dict = Depends(verify_jwt)):
    return {
        "id": token_payload.get("sub"),
        "email": token_payload.get("email"),
        "role": token_payload.get("role"),
    }


# 2. Явно описані роути для авторизації
@router.post("/register")
async def register(request: Request):
    return await proxy_request(request, "register")


@router.post("/login")
async def login(request: Request):
    return await proxy_request(request, "login")


@router.post("/refresh")
async def refresh(request: Request):
    return await proxy_request(request, "refresh")


@router.post("/logout")
async def logout(request: Request):
    return await proxy_request(request, "logout")
