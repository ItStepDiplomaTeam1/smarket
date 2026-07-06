from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.routers import cart, internal
from app.config import settings
from faststream.rabbit import RabbitBroker
from contextlib import asynccontextmanager

broker = RabbitBroker(settings.RABBITMQ_URL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await broker.connect()
    yield
    await broker.close()

app = FastAPI(
    title="Cart Service",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id"],
)

app.include_router(cart.router)
app.include_router(internal.router, prefix="/internal", tags=["Internal"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Cart service"}
