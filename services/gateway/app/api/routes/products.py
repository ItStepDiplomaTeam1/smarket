from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx
import jwt

from app.api.core.config import settings

router = APIRouter()

# Динамічна труба для всього, що йде на /products/*
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"], include_in_schema=False)
async def proxy_to_product(request: Request, path: str):
    client: httpx.AsyncClient = request.app.state.http_client

    # Формуємо кінцеву URL-адресу до мікросервісу товарів
    target_url = f"{settings.PRODUCT_SERVICE_URL}/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)

    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        auth_header = headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Авторизація обов'язкова для цієї операції")
        
        token = auth_header.split(" ")[1]
        try:
            # Розшифровуємо токен
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])

            # ПЕРЕВІРКА НА АДМІНА:
            # Якщо роль користувача не 'admin', Gateway дає відсіч і не пускає запит у мережу
            if payload.get("role") != "admin":
                raise HTTPException(status_code=403, detail="Доступ заборонено. Потрібні права адміністратора!")
            
            # Якщо це адмін — збагачуємо хедери для мікросервісу
            headers["X-User-Id"] = str(payload.get("sub"))
            headers["X-User-Role"] = str(payload.get("role"))

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Сесія застаріла, увійдіть знову")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Невалідний токен доступу")
    
    # Якщо це був звичайний GET (перегляд товарів), блок перевірки вище просто проігнорується.
    # Запит полетить у мікросервіс як від анонімного гостя.
    try:
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=request.stream()
        )
        response = await client.send(req, stream=True)
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=dict(response.headers)
        )
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Сервіс товарів (Product Service) недоступний")
