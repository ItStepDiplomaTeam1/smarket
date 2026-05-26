from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from app.api.routes import auth, products

# Ця функція виконається один раз при старті сервера
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Створюємо глобальний клієнт з пулом при старті сервера
    app.state.http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=50, max_connections=100),
        timeout=10.0
    )
    print("HTTP Client ініціалізовано з пулом з'єднань")
   
    yield

    # Ця частина виконується при зупинці сервера
    await app.state.http_clinet.aclose()
    print("HTTP Client closed")

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

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(products.router, prefix="/products", tags=["Products Service"])

# -------------------------------------------------

@app.get("/health", tags=["System"])
async def root():
    return {"status": "ok", "service": "Api Gateway"}