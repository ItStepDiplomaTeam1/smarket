from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings
from app.api.dependencies import verify_jwt

router = APIRouter()


# 1. Захищений роут: вимагає токен (перевірка через Depends)
@router.get("/me")
async def get_current_user(token_payload: dict = Depends(verify_jwt)):
    return {
        "id": token_payload.get("sub"),
        "email": token_payload.get("email"),
        "role": token_payload.get("role"),
    }


# 2. Відкритий роут: ловить все, що стосується логіну, реєстрації тощо
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_auth_service(request: Request, path: str):
    client: httpx.AsyncClient = request.app.state.http_client

    if path == "me":
        pass

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
