from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.routers import cart

app = FastAPI(
    title="Cart Service",
    version="1.0.0",
    default_response_class=ORJSONResponse,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id"],
)

app.include_router(cart.router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Cart service"}
