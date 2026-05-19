import bcrypt


from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from services.api.plugins.security.limiters.auth_limiter import auth_limiter
from services.api.database.session import get_db
from services.api.database.services.create_tables import User
from services.api.plugins.security.secrets.load_secret import get_secret
# Убираем алиас "as Request", чтобы не было конфликта с fastapi.Request
from services.api.schemas.auth import RegisterRequest, RegisterResponse, LoginResponse
from services.api.plugins.security.jwt_handler import create_access_token


router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@auth_limiter.limit("3/minute")
@auth_limiter.limit("10/hour")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        inner_user = User(
            email=body.email,
            hashed_password=bcrypt.hashpw(body.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            role="user",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(inner_user)
        await db.commit()
        await db.refresh(inner_user)

        response = RegisterResponse(
            access_token=create_access_token(str(inner_user.id), inner_user.role),
            token_type="bearer",
            email=body.email,
        )

        return response

    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))



@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
@auth_limiter.limit("5/minute")
@auth_limiter.limit("20/hour")
async def login(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()

        if user is None or not bcrypt.checkpw(body.password.encode('utf-8'), user.hashed_password.encode('utf-8')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return LoginResponse(
            access_token=create_access_token(str(user.id), user.role),
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )