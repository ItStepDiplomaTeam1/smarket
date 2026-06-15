from fastapi import FastAPI
from app.routers import cart

app = FastAPI(
    title="Cart Service",
    version="1.0.0"
)
app.include_router(cart.router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Cart service"}