from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx

from app.api.core.config import settings

router = APIRouter()


@router.api_route("/{path:path}", methods=["GET"], include_in_schema=False)
async def proxy_to_stores(request: Request, path: str):
    client: httpx.AsyncClient = request.app.state.http_client

    target_url = f"{settings.STORES_SERVICE_URL}/{path}"

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
    except httpx.ReadTimeout:
        raise HTTPException(
            status_code=504, detail="Сервіс магазинів не відповів вчасно"
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503, detail="Сервіс магазинів (Product Service) недоступний"
        )
