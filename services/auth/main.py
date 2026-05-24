from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from services.api.plugins.security.limiters.auth_limiter import auth_limiter
from services.api.database.session import get_db
from services.api.database.services.models import User
from services.api.database.services.checking.user import get_authenticated_user
from services.api.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginResponse,
    TokenResponse,
)
from services.api.plugins.security.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
    JWTExpiredError,
    JWTInvalidError,
)
from services.api.plugins.security.hash.password import hash_password

router = APIRouter()

REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except (JWTExpiredError, JWTInvalidError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    return user


def _extract_bearer_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[len("Bearer "):]
    return None


def _is_invalid_token(token: str) -> bool:
    try:
        decode_token(token)
        return False
    except (JWTExpiredError, JWTInvalidError):
        return True


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@auth_limiter.limit("3/minute")
@auth_limiter.limit("10/hour")
async def register(
        request: Request,
        response: Response,
        body: RegisterRequest,
        db: AsyncSession = Depends(get_db)
):
    try:
        inner_user = User(
            email=body.email,
            hashed_password=hash_password(body.password),
            role="user",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(inner_user)
        await db.commit()
        await db.refresh(inner_user)

        access_token = create_access_token(str(inner_user.id), inner_user.role)
        refresh_token = create_refresh_token(str(inner_user.id), inner_user.role)

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=REFRESH_TOKEN_MAX_AGE,
        )

        return RegisterResponse(
            access_token=access_token,
            token_type="bearer",
            email=body.email,
        )

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
        response: Response,
        body: RegisterRequest,
        db: AsyncSession = Depends(get_db)
):
    token = _extract_bearer_token(request)
    if token and _is_invalid_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = await get_authenticated_user(db, body.email, body.password)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(str(user.id), user.role)
        refresh_token = create_refresh_token(str(user.id), user.role)

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=REFRESH_TOKEN_MAX_AGE,
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh(request: Request):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(refresh_token)
    except (JWTExpiredError, JWTInvalidError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(
        access_token=create_access_token(payload["sub"], payload["role"]),
        token_type="bearer",
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return