from fastapi import FastAPI
from app.routers.cart import router as cart_router

app = FastAPI(title="Cart Service API", description="Мікросервіс для роботи з корзиною користувачів")

app.include_router(cart_router)