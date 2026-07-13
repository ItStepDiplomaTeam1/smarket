import os
import secrets
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
from services.auth_service.plugins.security.auth_cache import (
    cache_auth_user,
    invalidate_cached_auth_user,
    _get_redis_client,
)
from services.auth_service.plugins.security.hash.password import hash_password, verify_password
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
from services.auth_service.plugins.security.otp import generate_secure_otp, save_otp, verify_otp
from services.auth_service.plugins.security.email_sender import send_otp_email, send_password_reset_email
from services.auth_service.shared.DTO import (
    ChangePasswordRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UpdateSettingsRequest,
    UserResponse,
    RegisterPendingResponse,
    VerifyOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

router = APIRouter(default_response_class=ORJSONResponse)


def _get_cookie_secure() -> bool:
    val = os.getenv("COOKIE_SECURE")
    if val is not None:
        return val.lower() in ("true", "1", "yes")
    return os.getenv("DEBUG", "False").lower() not in ("true", "1", "yes")


_REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60
_COOKIE_SECURE = _get_cookie_secure()
_security = HTTPBearer()


def _build_cookie_params(value: str | None = None, is_delete: bool = False) -> dict:
    """
    Builds parameters for set_cookie or delete_cookie based on env variables.
    """
    samesite = os.getenv("COOKIE_SAMESITE", "lax").lower()
    domain = os.getenv("COOKIE_DOMAIN")

    params = {
        "key": "refresh_token",
        "httponly": True,
        "secure": _COOKIE_SECURE,
        "samesite": samesite,
        "path": "/",
    }

    if domain:
        params["domain"] = domain

    if not is_delete:
        if value is not None:
            params["value"] = value
        params["max_age"] = _REFRESH_TOKEN_MAX_AGE

    return params



def _mask_email(email: str) -> str:
    """Mask email for safe logging (GDPR compliance)."""
    if "@" not in email:
        return "***"
    local, domain = email.rsplit("@", 1)
    masked_local = local[0] + "***" if len(local) <= 2 else local[0] + "***" + local[-1]
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


@router.post("/register", response_model=RegisterPendingResponse, status_code=status.HTTP_201_CREATED)
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
        # Check if email is already registered
        result = await db.execute(select(User).where(User.email == body.email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            if existing_user.is_active:
                logger.warning(f"Помилка реєстрації: email {_mask_email(body.email)} вже існує та активний")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered",
                )
            else:
                logger.info(f"Оновлення пароля та повторний запит OTP для неактивного користувача з email: {_mask_email(body.email)}")
                existing_user.hashed_password = hash_password(body.password)
                existing_user.updated_at = datetime.now(UTC)
                if body.name:
                    updated_settings = dict(existing_user.settings or {})
                    updated_settings["name"] = body.name
                    existing_user.settings = updated_settings
                inner_user = existing_user
        else:
            settings_dict = {}
            if body.name:
                settings_dict["name"] = body.name
            inner_user = User(
                email=body.email,
                hashed_password=hash_password(body.password),
                role="user",
                is_active=False,
                settings=settings_dict,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
            db.add(inner_user)

        await db.commit()
        await db.refresh(inner_user)

        otp_code = generate_secure_otp(length=6)
        await save_otp(body.email, otp_code)
        await send_otp_email(body.email, otp_code)

        logger.success(
            f"Користувача {_mask_email(body.email)} успішно зареєстровано (в стані pending) з ID: {inner_user.id}"
        )
        return RegisterPendingResponse(
            message="Verification email sent. Please verify your OTP to complete registration.",
            email=body.email,
        )

    except HTTPException:
        raise
    except IntegrityError as err:
        await db.rollback()
        logger.warning(f"Помилка реєстрації (унікальність): email {_mask_email(body.email)} вже існує в системі")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from err
    except Exception as err:
        await db.rollback()
        logger.exception("Критична помилка під час реєстрації користувача")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        ) from err


@router.post("/register/verify", response_model=RegisterResponse, status_code=status.HTTP_200_OK)
async def register_verify(
    request: Request,
    response: Response,
    body: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"Запит на верифікацію OTP для email: {_mask_email(body.email)}")
    try:
        otp_valid = await verify_otp(body.email, body.code)
        if not otp_valid:
            logger.warning(f"Невалідний або прострочений OTP для email: {_mask_email(body.email)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code",
            )

        # Retrieve pending user
        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"Користувача з email {_mask_email(body.email)} не знайдено під час верифікації")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found",
            )

        user.is_active = True
        user.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(user)

        # Cache authenticated user
        await cache_auth_user(user)

        # Issue JWT tokens
        access_token = create_access_token(str(user.id), user.role, user.email)
        refresh_token = create_refresh_token(str(user.id), user.role, user.email)

        # Set refresh token cookie
        response.set_cookie(**_build_cookie_params(value=refresh_token))

        logger.success(f"Користувач {_mask_email(body.email)} успішно верифікований та активований")
        return RegisterResponse(
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
    except Exception as err:
        await db.rollback()
        logger.exception("Критична помилка під час верифікації OTP")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        ) from err


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
        logger.warning(
            f"Спроба авторизації з невалідним токеном у заголовку для {_mask_email(body.email)}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = await get_authenticated_user(db, body.email, body.password)

        if user is None:
            logger.warning(
                f"Невдала спроба входу: неправильний пароль або email для {_mask_email(body.email)}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(str(user.id), user.role, user.email)
        refresh_token = create_refresh_token(str(user.id), user.role, user.email)

        response.set_cookie(**_build_cookie_params(value=refresh_token))

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
    except Exception as err:
        logger.exception("Критична помилка під час входу користувача")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        ) from err


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
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

    user_id = payload.get("sub")
    import uuid

    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError) as err:
        logger.warning(f"Невалідний формат ID користувача в токені: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(f"Користувача з ID {user_id} не знайдено при оновленні токена")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning(f"Користувач {user.email} (ID: {user_id}) неактивний при оновленні токена")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.info(
        f"Успішно оновлено токени для користувача з ID: {payload.get('sub')} (роль: {user.role})"
    )

    old_jti = payload.get("jti")
    if old_jti:
        exp_ts = payload.get("exp")
        if exp_ts:
            if isinstance(exp_ts, datetime):
                old_ttl = int((exp_ts - datetime.now(UTC)).total_seconds())
            else:
                old_ttl = int(exp_ts - datetime.now(UTC).timestamp())
            if old_ttl > 0:
                await blacklist_token(old_jti, old_ttl)

    new_access_token = create_access_token(str(user.id), user.role, user.email)
    new_refresh_token = create_refresh_token(str(user.id), user.role, user.email)

    response.set_cookie(**_build_cookie_params(value=new_refresh_token))
    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
    )


@router.get("/me")
async def get_me(current_user: User = Depends(_get_current_user)):
    logger.info(
        f"Користувач {current_user.email} (ID: {current_user.id}) запитав інформацію про себе"
    )
    settings_dict = current_user.settings or {}
    username = None

    if settings_dict.get("telegram_username"):
        username = settings_dict.get("telegram_username")
    elif settings_dict.get("telegram_first_name"):
        username = settings_dict.get("telegram_first_name")
    elif settings_dict.get("google_name"):
        username = settings_dict.get("google_name")
    elif settings_dict.get("name"):
        username = settings_dict.get("name")

    if not username:
        username = (
            current_user.email.split("@")[0] if "@" in current_user.email else current_user.email
        )

    photo_url = settings_dict.get("photo_url")

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": username,
        "role": current_user.role,
        "settings": settings_dict,
        "photo_url": photo_url,
    }


@router.patch("/password", status_code=status.HTTP_200_OK)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Поточний пароль вказано неправильно",
        )

    current_user.hashed_password = hash_password(body.new_password)
    await db.commit()
    await invalidate_cached_auth_user(current_user.email)
    return {"message": "Пароль успішно змінено"}


@router.patch("/settings", status_code=status.HTTP_200_OK)
async def update_settings(
    body: UpdateSettingsRequest,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.settings = body.settings
    await db.commit()
    return {"message": "Налаштування збережено", "settings": current_user.settings}


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
    response.delete_cookie(**_build_cookie_params(is_delete=True))
    return


@router.get("/users/{user_id}")
async def get_user_by_id(user_id: str, db: AsyncSession = Depends(get_db)):
    import uuid

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        ) from err
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    username = user.email.split("@")[0] if "@" in user.email else user.email
    return {"id": str(user.id), "email": user.email, "username": username, "role": user.role}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Запит на відновлення пароля для email: {_mask_email(body.email)}")
    
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        try:
            redis_client = _get_redis_client()
            await redis_client.setex(f"pwd_reset:{token}", 900, body.email)
            
            frontend_url = os.getenv("FRONTEND_URL") or "http://localhost:5173"
            reset_link = f"{frontend_url}/reset-password?token={token}&email={body.email}"
            
            await send_password_reset_email(body.email, reset_link)
            logger.success(f"Надіслано лист для відновлення пароля для {_mask_email(body.email)}")
        except Exception as e:
            logger.error(f"Помилка при створенні токена відновлення пароля для {body.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error",
            )
            
    return {"message": "Якщо email зареєстрований в системі, лист із інструкціями для відновлення пароля надіслано."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Запит на скидання пароля за токеном для email: {_mask_email(body.email)}")
    
    try:
        redis_client = _get_redis_client()
        stored_email_bytes = await redis_client.get(f"pwd_reset:{body.token}")
        if not stored_email_bytes:
            logger.warning(f"Спроба скидання пароля з невалідним або простроченим токеном для {_mask_email(body.email)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Недійсний або прострочений токен відновлення пароля",
            )
            
        stored_email = stored_email_bytes.decode("utf-8")
        if stored_email.strip().lower() != body.email.strip().lower():
            logger.warning(f"Невідповідність email для токена відновлення: {stored_email} != {body.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Недійсний або прострочений токен відновлення пароля",
            )
            
        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Користувача не знайдено або він неактивний",
            )
            
        user.hashed_password = hash_password(body.new_password)
        user.updated_at = datetime.now(UTC)
        await db.commit()
        
        await redis_client.delete(f"pwd_reset:{body.token}")
        await invalidate_cached_auth_user(body.email)
        
        logger.success(f"Пароль користувача {_mask_email(body.email)} успішно оновлено")
        return {"message": "Пароль успішно оновлено"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("Критична помилка під час скидання пароля")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        ) from e
