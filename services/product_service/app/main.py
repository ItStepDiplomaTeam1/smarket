from fastapi import FastAPI

app = FastAPI(
    title="Product Service",
    description="Мікросервіс для управління продуктами",
    version="1.0.0"
)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Product service"}