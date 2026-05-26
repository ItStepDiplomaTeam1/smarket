from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def products_stub():
    return {"message": "Products Proxy"}