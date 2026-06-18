import os
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import ORJSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from services.auth_service.database.models import User
from services.auth_service.database.session import get_db
from services.auth_service.plugins.checking.user import get_authenticated_user
from services.auth_service.plugins.security.hash.password import hash_password
from services.auth_service.plugins.security.jwt_handler import (
    JWTExpiredError,
    JWTInvalidError,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from services.auth_service.plugins.security.limiters.auth_limiter import auth_limiter
from services.auth_service.plugins.security.token_blacklist import (
    blacklist_token,
    is_token_blacklisted,
)
from services.auth_service.shared.DTO import (
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
)

router = APIRouter(default_response_class=ORJSONResponse)

_REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60
_COOKIE_SECURE = os.getenv("DEBUG", "False").lower() not in ("true", "1", "yes")
_security = HTTPBearer()


def _mask_email(email: str) -> str:
    """Mask email for safe logging (GDPR compliance)."""
    if "@" not in email:
        return "***"
    local, domain = email.rsplit("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[0] + "***" + local[-1]
    return f"{masked_local}@{domain}"


async def _get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except (JWTExpiredError, JWTInvalidError) as err:
        logger.warning("Спроба доступу з невалідним або простроченим токеном")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err

    if payload.get("type") != "access":
        logger.warning(f"Надано неправильний тип токена: {payload.get('type')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(f"Користувача з ID {user_id} не знайдено в базі даних")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning(f"Запит від неактивного користувача з ID {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    return user


def _extract_bearer_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[len("Bearer ") :]
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
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"Запит на реєстрацію нового користувача з email: {_mask_email(body.email)}")
    try:
        inner_user = User(
            email=body.email,
            hashed_password=hash_password(body.password),
            role="user",
            is_active=True,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        db.add(inner_user)
        await db.commit()
        await db.refresh(inner_user)

        access_token = create_access_token(str(inner_user.id), inner_user.role, inner_user.email)
        refresh_token = create_refresh_token(str(inner_user.id), inner_user.role, inner_user.email)

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=_COOKIE_SECURE,
            samesite="lax",
            max_age=_REFRESH_TOKEN_MAX_AGE,
        )

        logger.success(f"Користувача {_mask_email(body.email)} успішно зареєстровано з ID: {inner_user.id}")
        return RegisterResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=str(inner_user.id),
                email=inner_user.email,
                role=inner_user.role,
            ),
        )

    except IntegrityError as err:
        await db.rollback()
        logger.warning(f"Помилка реєстрації: email {_mask_email(body.email)} вже існує в системі")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from err
    except Exception:
        await db.rollback()
        logger.exception("Критична помилка під час реєстрації користувача")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
@auth_limiter.limit("5/minute")
@auth_limiter.limit("20/hour")
async def login(
    request: Request,
    response: Response,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"Запит на авторизацію користувача з email: {_mask_email(body.email)}")
    token = _extract_bearer_token(request)
    if token and _is_invalid_token(token):
        logger.warning(f"Спроба авторизації з невалідним токеном у заголовку для {_mask_email(body.email)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = await get_authenticated_user(db, body.email, body.password)

        if user is None:
            logger.warning(f"Невдала спроба входу: неправильний пароль або email для {_mask_email(body.email)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(str(user.id), user.role, user.email)
        refresh_token = create_refresh_token(str(user.id), user.role, user.email)

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=_COOKIE_SECURE,
            samesite="lax",
            max_age=_REFRESH_TOKEN_MAX_AGE,
        )

        logger.success(f"Користувач {_mask_email(body.email)} успішно авторизований. ID: {user.id}")
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                role=user.role,
            ),
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("Критична помилка під час входу користувача")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
    


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        logger.warning("Спроба оновлення токена без наявності refresh_token у куках")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(refresh_token)
    except (JWTExpiredError, JWTInvalidError) as err:
        logger.warning("Спроба оновлення з невалідним або простроченим refresh токеном")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err

    if payload.get("type") != "refresh":
        logger.warning(f"Для оновлення надано токен невідповідного типу: {payload.get('type')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti):
        logger.warning(f"Спроба оновлення з анульованим refresh токеном (jti: {jti})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.info(f"Успішно оновлено токени для користувача з ID: {payload.get('sub')}")
    new_access_token = create_access_token(payload["sub"], payload["role"], payload.get("email", "user@example.com"))
    new_refresh_token = create_refresh_token(payload["sub"], payload["role"], payload.get("email", "user@example.com"))

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax",
        max_age=_REFRESH_TOKEN_MAX_AGE,
    )
    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
    )


@router.get("/me")
async def get_me(current_user: User = Depends(_get_current_user)):
    logger.info(
        f"Користувач {current_user.email} (ID: {current_user.id}) запитав інформацію про себе"
    )
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response):
    logger.info("Запит на вихід із системи, видалення refresh токена з кук")
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti")
            if jti:
                from datetime import UTC, datetime
                exp_ts = payload.get("exp")
                if exp_ts:
                    if isinstance(exp_ts, datetime):
                        ttl = int((exp_ts - datetime.now(UTC)).total_seconds())
                    else:
                        ttl = int(exp_ts - datetime.now(UTC).timestamp())
                    if ttl > 0:
                        await blacklist_token(jti, ttl)
        except Exception:
            logger.exception("Не вдалося заблокувати refresh токен при logout")
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax",
    )
    return


@router.get("/users/{user_id}")
async def get_user_by_id(user_id: str, db: AsyncSession = Depends(get_db)):
    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    username = user.email.split("@")[0] if "@" in user.email else user.email
    return {
        "id": str(user.id),
        "email": user.email,
        "username": username,
        "role": user.role
    }

