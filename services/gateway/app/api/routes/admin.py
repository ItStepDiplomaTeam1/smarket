from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import jwt

import asyncio

from app.api.core.config import settings

router = APIRouter()

_ADMIN_ROLES = {"admin", "superadmin"}

# Service names returned when the product_service is unreachable
_FALLBACK_SERVICES = ["PostgreSQL", "Redis", "Meilisearch", "RabbitMQ"]


def _verify_admin_token(request: Request) -> dict:
    """
    Decode and validate the JWT from the Authorization header.
    Raises 401/403 if the token is missing, invalid, or not an admin.
    Returns the decoded payload on success.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Авторизація обов'язкова")

    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Сесія застаріла, увійдіть знову")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Невалідний токен доступу")

    if payload.get("role") not in _ADMIN_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Доступ заборонено. Потрібні права адміністратора.",
        )

    return payload


async def _proxy_to_auth(
    request: Request, path: str, payload: dict
) -> StreamingResponse:
    """Forward the request to auth_service, enriching headers with user context."""
    client: httpx.AsyncClient = request.app.state.http_client
    target_url = f"{settings.AUTH_SERVICE_URL}/admin/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)
    # Inject extracted user context so auth_service can trust it without re-decoding
    headers["X-User-Id"] = str(payload.get("sub", ""))
    headers["X-User-Role"] = str(payload.get("role", ""))

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


# ── Admin Routes ──────────────────────────────────────────────────────────────

@router.get("/audit", tags=["Admin", "Audit Logs"])
async def get_audit_logs(request: Request):
    """
    Returns audit logs from audit_service.
    Requires admin role.
    """
    payload = _verify_admin_token(request)
    client: httpx.AsyncClient = request.app.state.http_client
    
    target_url = f"{settings.AUDIT_SERVICE_URL}/admin/audit"
    headers = dict(request.headers)
    headers.pop("host", None)
    headers["X-User-Id"] = str(payload.get("sub", ""))
    headers["X-User-Role"] = str(payload.get("role", ""))

    try:
        req = client.build_request(
            method=request.method,
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
        raise HTTPException(status_code=503, detail="Audit service unavailable")



@router.get("/recent-users")
async def get_recent_users(request: Request):
    """
    Returns the most recently registered users with their cart and review counts.
    Requires admin role — validated locally at the Gateway before proxying.
    """
    payload = _verify_admin_token(request)
    client: httpx.AsyncClient = request.app.state.http_client
    
    target_url = f"{settings.AUTH_SERVICE_URL}/admin/recent-users"
    headers = dict(request.headers)
    headers.pop("host", None)
    headers["X-User-Id"] = str(payload.get("sub", ""))
    headers["X-User-Role"] = str(payload.get("role", ""))

    try:
        resp = await client.get(target_url, headers=headers, params=request.query_params)
        if resp.status_code != 200:
            return JSONResponse(content={"detail": "Auth service error"}, status_code=resp.status_code)
        users = resp.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Auth service unavailable")

    users_list = users if isinstance(users, list) else users.get("users", [])
    if not users_list:
        return JSONResponse(content=users)

    user_ids = [str(u.get("id")) for u in users_list if u.get("id")]

    async def fetch_counts(service_url: str, endpoint: str):
        try:
            r = await client.post(f"{service_url}{endpoint}", json={"user_ids": user_ids}, timeout=5.0)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        return {}

    cart_counts, review_counts = await asyncio.gather(
        fetch_counts(settings.CART_SERVICE_URL, "/internal/carts/counts"),
        fetch_counts(settings.REVIEWS_SERVICE_URL, "/internal/reviews/counts")
    )

    for u in users_list:
        uid = str(u.get("id"))
        u["cart_count"] = cart_counts.get(uid, 0)
        u["reviews_count"] = review_counts.get(uid, 0)

    if isinstance(users, list):
        return JSONResponse(content=users_list)
    else:
        users["users"] = users_list
        return JSONResponse(content=users)


@router.get("/dashboard-summary")
async def get_dashboard_summary(request: Request):
    """
    Returns aggregate stats and mock data for the admin dashboard.
    Fetches real metrics from product_service and auth_service.
    """
    _verify_admin_token(request)
    client: httpx.AsyncClient = request.app.state.http_client

    async def fetch_product_stats():
        try:
            resp = await client.get(f"{settings.PRODUCT_SERVICE_URL}/api/v1/internal/dashboard-stats", timeout=5.0)
            if resp.status_code == 200:
                return resp.json()
        except Exception:
            pass
        return {"totalProducts": 0, "totalStores": 0, "pricesUpdatedToday": 0}

    async def fetch_auth_stats():
        try:
            resp = await client.get(f"{settings.AUTH_SERVICE_URL}/internal/dashboard-stats", timeout=5.0)
            if resp.status_code == 200:
                return resp.json()
        except Exception:
            pass
        return {"totalUsers": 0}

    async def fetch_system_logs():
        try:
            resp = await client.get(
                f"{settings.AUDIT_SERVICE_URL}/admin/audit",
                params={"limit": 5},
                timeout=5.0
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                logs = []
                status_map = {"info": "success", "warning": "warning", "error": "error"}
                for item in items:
                    logs.append({
                        "id": str(item.get("id", "")),
                        "time": item.get("created_at", ""),
                        "event": item.get("event_type", "Unknown Event"),
                        "details": item.get("details", "") or item.get("message", "") or item.get("actor", ""),
                        "status": status_map.get(item.get("severity", "info"), "info")
                    })
                return logs
        except Exception:
            pass
        return []

    MOCK_RATINGS = [
        {"rating": 4.8, "reviews": 412},
        {"rating": 4.6, "reviews": 287},
        {"rating": 4.9, "reviews": 193},
        {"rating": 4.3, "reviews": 156},
        {"rating": 4.7, "reviews": 98},
    ]

    async def fetch_popular_products():
        try:
            resp = await client.get(
                f"{settings.PRODUCT_SERVICE_URL}/api/v1/products/",
                params={"limit": 5},
                timeout=5.0,
                follow_redirects=True
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                popular_products = []
                for i, item in enumerate(items):
                    if i < len(MOCK_RATINGS):
                        mock_rating = MOCK_RATINGS[i]
                        cat = item.get("category")
                        cat_name = cat.get("name", "—") if isinstance(cat, dict) else "—"
                        popular_products.append({
                            "id": str(item.get("id", "")),
                            "name": item.get("title", ""),
                            "category": cat_name,
                            "image": item.get("image_url") or "",
                            "rating": mock_rating["rating"],
                            "reviews": mock_rating["reviews"],
                        })
                return popular_products
        except Exception as e:
            import traceback
            print(f"[Gateway] Error fetching popular products: {e}", flush=True)
            traceback.print_exc()
        return []

    prod_stats, auth_stats, system_logs, popular_products = await asyncio.gather(
        fetch_product_stats(), 
        fetch_auth_stats(),
        fetch_system_logs(),
        fetch_popular_products()
    )

    return JSONResponse(content={
        "metrics": {
            "totalProducts": prod_stats.get("totalProducts", 0),
            "totalStores": prod_stats.get("totalStores", 0),
            "totalUsers": auth_stats.get("totalUsers", 0),
            "pricesUpdatedToday": prod_stats.get("pricesUpdatedToday", 0),
        },
        "priceDynamics": [],
        "systemLogs": system_logs,
        "needsAttention": [],
        "popularCategories": [],
        "newUsers": [],
        "searchQueries": [],
        "dataCollection": {
            "updatedToday": 0,
            "activeParsers": 0,
            "errors": 0
        },
        "sourceStatus": [],
        "systemStatus": [],
        "popularProducts": popular_products
    })



async def _probe_http_service(client: httpx.AsyncClient, url: str, timeout: float = 3.0) -> str:
    try:
        resp = await client.get(url, timeout=timeout)
        if resp.status_code == 200:
            return "Працює"
        return "Помилка"
    except Exception:
        return "Помилка"


async def _probe_search_service(client: httpx.AsyncClient, url: str) -> str:
    try:
        resp = await client.get(url, timeout=3.0)
        if resp.status_code == 200 and resp.json().get("status") == "up":
            return "Працює"
        return "Помилка"
    except Exception:
        return "Помилка"


async def _probe_etl_service(client: httpx.AsyncClient, url: str) -> tuple[str, str]:
    try:
        resp = await client.get(url, timeout=3.0)
        if resp.status_code == 200:
            data = resp.json()
            mongo_status = "Працює" if data.get("mongodb") == "ok" else "Помилка"
            return "Працює", mongo_status
        return "Помилка", "Помилка"
    except Exception:
        return "Помилка", "Помилка"


@router.get("/system-status")
async def get_system_status(request: Request):
    """
    Returns real-time operational status of all infrastructure and microservices.
    Probes are performed in parallel from the Gateway.
    """
    _verify_admin_token(request)

    client: httpx.AsyncClient = request.app.state.http_client
    probe_url = f"{settings.PRODUCT_SERVICE_URL}/api/v1/internal/health-check"

    # Database status probe task
    async def get_db_statuses():
        try:
            response = await client.get(probe_url, timeout=5.0)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        return {name: "Помилка" for name in _FALLBACK_SERVICES}

    # Run all probes concurrently
    db_task = get_db_statuses()
    auth_task = _probe_http_service(client, f"{settings.AUTH_SERVICE_URL}/health")
    product_task = _probe_http_service(client, f"{settings.PRODUCT_SERVICE_URL}/health")
    cart_task = _probe_http_service(client, f"{settings.CART_SERVICE_URL}/health")
    reviews_task = _probe_http_service(client, f"{settings.REVIEWS_SERVICE_URL}/health")
    search_task = _probe_search_service(client, f"{settings.SEARCH_SERVICE_URL}/api/v1/health")
    etl_task = _probe_etl_service(client, f"{settings.ETL_SERVICE_URL}/health")
    email_task = _probe_http_service(client, f"{settings.EMAIL_WORKER_URL}/health")

    (db_res, auth_res, product_res, cart_res, reviews_res, 
     search_res, (etl_res, mongo_res), email_res) = await asyncio.gather(
        db_task, auth_task, product_task, cart_task, reviews_task, search_task, etl_task, email_task
    )

    # Compile result dict
    service_statuses = {
        # Infrastructure / Databases
        "PostgreSQL": db_res.get("PostgreSQL", "Помилка"),
        "Redis": db_res.get("Redis", "Помилка"),
        "Meilisearch": db_res.get("Meilisearch", "Помилка"),
        "RabbitMQ": db_res.get("RabbitMQ", "Помилка"),
        "MongoDB": mongo_res,
        
        # Microservices
        "API Gateway": "Працює",
        "Auth Service": auth_res,
        "Product Service": product_res,
        "Cart Service": cart_res,
        "Reviews Service": reviews_res,
        "Search Service": search_res,
        "ETL Service": etl_res,
        "Email Worker": email_res,
    }

    return JSONResponse(content=service_statuses)



@router.get("/etl/health")
async def get_etl_health(request: Request):
    """
    Проксює запит /health до ETL-воркера (products_etl).
    Повертає статус Go-сервісу та стан підключень до MongoDB / PostgreSQL.
    Вимагає роль адміністратора.
    """
    _verify_admin_token(request)

    client: httpx.AsyncClient = request.app.state.http_client
    try:
        response = await client.get(
            f"{settings.ETL_SERVICE_URL}/health",
            timeout=10.0,
        )
        return JSONResponse(
            content=response.json(),
            status_code=response.status_code,
        )
    except httpx.ConnectError:
        return JSONResponse(
            content={"status": "unavailable", "error": "ETL service unreachable"},
            status_code=503,
        )
    except httpx.TimeoutException:
        return JSONResponse(
            content={"status": "timeout", "error": "ETL service timed out"},
            status_code=504,
        )

@router.post("/users/{user_id}/block")
async def block_user(user_id: str, request: Request):
    payload = _verify_admin_token(request)
    return await _proxy_to_auth(request, f"users/{user_id}/block", payload)

@router.post("/users/{user_id}/unblock")
async def unblock_user(user_id: str, request: Request):
    payload = _verify_admin_token(request)
    return await _proxy_to_auth(request, f"users/{user_id}/unblock", payload)
