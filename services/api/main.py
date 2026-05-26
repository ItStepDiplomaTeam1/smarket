import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import ORJSONResponse
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from services.api.database.services.models import Product
from services.api.database.session import get_db
from services.api.plugins.logger import setup_logger

setup_logger()


class ProductCreateRequest(BaseModel):
    name: str = Field(..., max_length=255)
    category_id: uuid.UUID
    external_id: str = Field(..., max_length=255)
    general_description: str = Field(..., max_length=255)
    specifications: dict = Field(default_factory=dict)


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    category_id: uuid.UUID
    external_id: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Product Core API",
        version="0.1.0",
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    @app.get("/health", tags=["system"])
    async def health() -> dict:
        logger.info("Обробка хелсчеку")
        return {"status": "ok"}

    @app.post(
        "/products",
        response_model=ProductResponse,
        status_code=status.HTTP_201_CREATED,
        tags=["products"],
    )
    async def add_product(body: ProductCreateRequest, db: AsyncSession = Depends(get_db)):
        logger.info(f"Додавання нового продукту: {body.name}")
        try:
            new_product = Product(
                name=body.name,
                category_id=body.category_id,
                external_id=body.external_id,
                general_description=body.general_description,
                specifications=body.specifications,
            )
            db.add(new_product)
            await db.commit()
            await db.refresh(new_product)

            logger.success(f"Продукт успішно був доданий з ID: {new_product.id}")
            return new_product
        except Exception as e:
            await db.rollback()
            logger.error(f"Помилка при додаванні продукту: {e}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error during product creation",
            ) from e

    @app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["products"])
    async def delete_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
        logger.info(f"Реквест на видалення продукту з ID: {product_id}")

        stmt = delete(Product).where(Product.id == product_id)
        result = await db.execute(stmt)
        await db.commit()

        if result.rowcount == 0:
            logger.warning(f"Продукт з ID {product_id} не був знайдений для видалення")
            raise HTTPException(status_code=404, detail="Product not found")

        logger.success(f"Продукт {product_id} був успішно видалений")
        return None

    return app


app = create_app()
