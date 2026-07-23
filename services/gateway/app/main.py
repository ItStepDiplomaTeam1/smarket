import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.core.config import settings
from app.api.routes import (
    admin,
    agent,
    auth,
    cart,
    favorites,
    products,
    reviews,
    search,
    stores,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=50, max_connections=100),
        timeout=10.0,
    )
    app.state.auth_http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        timeout=10.0,
    )

    yield
    await app.state.http_client.aclose()
    await app.state.auth_http_client.aclose()


debug = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

app = FastAPI(
    title="Api Gateway",
    version="0.1.0",
    lifespan=lifespan,
    redirect_slashes=False,
    docs_url="/docs" if debug else None,
    redoc_url="/redoc" if debug else None,
    openapi_url="/openapi.json" if debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-Id"],
    expose_headers=["X-Request-Id"],
)

API_V1_STR = "/api/v1"

app.include_router(auth.router, prefix=f"{API_V1_STR}/auth", tags=["Auth Proxy v1"])
app.include_router(
    products.router, prefix=f"{API_V1_STR}/products", tags=["Products Proxy v1"]
)
app.include_router(
    stores.router, prefix=f"{API_V1_STR}/stores", tags=["Stores Proxy v1"]
)
app.include_router(cart.router, prefix=f"{API_V1_STR}/cart", tags=["Cart Proxy v1"])
app.include_router(
    reviews.router, prefix=f"{API_V1_STR}/reviews", tags=["Reviews Proxy v1"]
)
app.include_router(admin.router, prefix=f"{API_V1_STR}/admin", tags=["Admin Proxy v1"])
app.include_router(
    search.router, prefix=f"{API_V1_STR}/search", tags=["Search Proxy v1"]
)
app.include_router(agent.router, prefix=f"{API_V1_STR}/agent", tags=["Agent Proxy v1"])
app.include_router(
    favorites.router, prefix=f"{API_V1_STR}/favorites", tags=["Favorites Proxy v1"]
)


@app.get("/health", tags=["System"])
async def root():
    return {"status": "ok", "service": "Api Gateway", "version": "v1"}
