from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from app.api.routes import auth, products, cart


# Ця функція виконається один раз при старті сервера
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Створюємо глобальний клієнт з пулом при старті сервера
    app.state.http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=50, max_connections=100),
        timeout=10.0,
    )

    # Ця частина виконується при зупинці сервера
    yield
    await app.state.http_client.aclose()


# Створюємо сутність додатку та додаємо функцію lifespan
app = FastAPI(title="Api Gateway", version="0.1.0", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
#         CORS Налаштування (Додаємо цей блок)
# -------------------------------------------------
# Список адрес нашого фронтенду, яким ми довіряємо.
# React + Vite за замовчуванням використовує порт 5173, Next.js — 3000


# -------------------------------------------------
#               Routes Connecting
# -------------------------------------------------

# Задаємо глобальний префікс версії
API_V1_STR = "/api/v1"

# Підключаємо роутери з додаванням версіонування
app.include_router(auth.router, prefix=f"{API_V1_STR}/auth", tags=["Auth Proxy v1"])
app.include_router(
    products.router, prefix=f"{API_V1_STR}/products", tags=["Products Proxy v1"]
)
app.include_router(cart.router, prefix=f"{API_V1_STR}/cart", tags=["Cart Proxy v1"])


@app.get("/health", tags=["System"])
async def root():
    return {"status": "ok", "service": "Api Gateway", "version": "v1"}


# -------------------------------------------------
