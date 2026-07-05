from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from app.api.routes import auth, products, cart, stores, reviews, admin, search, agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=50, max_connections=100),
        timeout=10.0,
    )

    yield
    await app.state.http_client.aclose()


app = FastAPI(title="Api Gateway", version="0.1.0", lifespan=lifespan, redirect_slashes=False)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    # Production server
    "http://157.180.74.21",
    "http://157.180.74.21:80",
    "http://157.180.74.21:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-User-Id"],
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
app.include_router(search.router, prefix=f"{API_V1_STR}/search", tags=["Search Proxy v1"])
app.include_router(agent.router, prefix=f"{API_V1_STR}/agent", tags=["Agent Proxy v1"])


@app.get("/health", tags=["System"])
async def root():
    return {"status": "ok", "service": "Api Gateway", "version": "v1"}


# -------------------------------------------------
