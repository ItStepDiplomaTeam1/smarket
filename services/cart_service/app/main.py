from fastapi import FastAPI

app = FastAPI(
    title="Cart Service",
    description="Мікросервіс для роботи з корзиною (SMarket)",
    version="1.0.0"
)

@app.get("/health", tags=["Health"])
async def health_check():
    """Ендпоінт для перевірки працездатності сервісу"""
    return {"status": "ok", "service": "Cart service"}