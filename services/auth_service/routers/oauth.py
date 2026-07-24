from datetime import UTC, datetime

import httpx
from authlib.jose import JsonWebKey, JsonWebToken
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import ORJSONResponse
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.auth_service.database.models import User
from services.auth_service.database.session import get_db
from services.auth_service.plugins.security.jwt_handler import (
    create_access_token,
    create_refresh_token,
)
from services.auth_service.plugins.security.secrets.load_secret import get_secret
from services.auth_service.plugins.security.telegram_validator import verify_telegram_auth
from services.auth_service.routers.auth import _mask_email, _set_refresh_cookie
from services.auth_service.shared.DTO import (
    GoogleOAuthRequest,
    LoginResponse,
    TelegramAuthSchema,
    UserResponse,
)

router = APIRouter(
    prefix="/oauth",
    tags=["oauth"],
    default_response_class=ORJSONResponse,
)


# Cookie configuration parameters are imported from auth.py router
_GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


async def _verify_google_id_token(credential: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(_GOOGLE_JWKS_URL)
        resp.raise_for_status()

    jwks = JsonWebKey.import_key_set(resp.json())
    jwt = JsonWebToken(["RS256"])

    try:
        claims = jwt.decode(credential, jwks)
        claims.validate(leeway=60)
    except Exception as exc:
        raise ValueError(f"Invalid Google token: {exc}") from exc

    client_id = get_secret("GOOGLE_CLIENT_ID")
    aud = claims.get("aud")
    if isinstance(aud, list):
        if client_id not in aud:
            raise ValueError("Invalid token audience")
    elif aud != client_id:
        raise ValueError("Invalid token audience")

    return dict(claims)


async def _verify_google_access_token(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if resp.status_code != 200:
        raise ValueError(f"Google UserInfo request failed: {resp.status_code} {resp.text}")

    info = resp.json()

    if not info.get("email"):
        raise ValueError("Google UserInfo returned no email")

    if not info.get("email_verified", False):
        raise ValueError("Google account email is not verified")

    return info


@router.post("/google", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def oauth_google_login(
    response: Response,
    body: GoogleOAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    claims: dict | None = None

    if body.credential:
        try:
            claims = await _verify_google_id_token(body.credential)
            logger.debug("Google OAuth: verified via ID token (JWT)")
        except ValueError as exc:
            logger.warning(f"Google OAuth: ID token verification failed — {exc}")

    if claims is None and body.access_token:
        try:
            claims = await _verify_google_access_token(body.access_token)
            logger.debug("Google OAuth: verified via access_token → UserInfo")
        except ValueError as exc:
            logger.warning(f"Google OAuth: access_token verification failed — {exc}")

    if claims is None:
        logger.warning("Google OAuth: відхилено токен — жоден метод верифікації не спрацював")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        )

    email: str = claims.get("email", "")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account has no email",
        )

    logger.info(f"Google OAuth: запит від {_mask_email(email)}")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    google_name = claims.get("name")
    google_picture = claims.get("picture")

    if user is None:
        settings_dict = {}
        if google_name:
            settings_dict["google_name"] = google_name
        if google_picture:
            settings_dict["google_picture"] = google_picture
            settings_dict["photo_url"] = google_picture

        user = User(
            email=email,
            hashed_password="OAUTH_NO_PASSWORD",
            role="user",
            is_active=True,
            settings=settings_dict,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.success(
            f"Google OAuth: новий користувач {_mask_email(email)} зареєстрований, ID: {user.id}"
        )
    else:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled",
            )
        # Update user settings with any updated Google data
        updated_settings = dict(user.settings or {})
        if google_name:
            updated_settings["google_name"] = google_name
        if google_picture:
            updated_settings["google_picture"] = google_picture
            updated_settings["photo_url"] = google_picture
        user.settings = updated_settings
        user.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(user)
        logger.info(
            f"Google OAuth: існуючий користувач {_mask_email(email)} (ID: {user.id}) увійшов"
        )

    token_version = int(getattr(user, "token_version", 0) or 0)
    access_token = create_access_token(str(user.id), user.role, user.email, token_version)
    refresh_token = create_refresh_token(str(user.id), user.role, user.email, token_version)

    _set_refresh_cookie(response, refresh_token)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            role=user.role,
            settings=user.settings or {},
        ),
    )


@router.post("/telegram", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def oauth_telegram_login(
    response: Response,
    body: TelegramAuthSchema,
    db: AsyncSession = Depends(get_db),
):
    # Validate Telegram auth payload
    payload_dict = body.model_dump()
    if not verify_telegram_auth(payload_dict):
        logger.warning(f"Telegram OAuth: signature verification failed for ID {body.id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram signature or expired authentication data",
        )

    logger.info(f"Telegram OAuth: request from Telegram ID {body.id} ({body.username or ''})")

    # Check if user exists by telegram_id
    result = await db.execute(select(User).where(User.telegram_id == body.id))
    user = result.scalar_one_or_none()

    if user is None:
        # User not found -> Register new user with placeholder email
        email = f"tg_{body.id}@smarket.local"

        # In case a user already exists with this generated email
        email_check = await db.execute(select(User).where(User.email == email))
        if email_check.scalar_one_or_none():
            logger.error(f"Telegram OAuth: collision detected for generated email {email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User email collision detected during registration",
            )

        # Store Telegram metadata in settings JSONB
        settings_dict = {
            "telegram_first_name": body.first_name,
            "telegram_last_name": body.last_name,
            "telegram_username": body.username,
            "photo_url": body.photo_url,
        }

        user = User(
            email=email,
            hashed_password="TELEGRAM_OAUTH_NO_PASSWORD",
            role="user",
            is_active=True,
            telegram_id=body.id,
            settings=settings_dict,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.success(
            f"Telegram OAuth: new user registered via Telegram ID {body.id}, User ID: {user.id}"
        )
    else:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled",
            )
        # Update user settings with any updated Telegram data
        updated_settings = dict(user.settings or {})
        updated_settings.update(
            {
                "telegram_first_name": body.first_name,
                "telegram_last_name": body.last_name,
                "telegram_username": body.username,
                "photo_url": body.photo_url,
            }
        )
        user.settings = updated_settings
        user.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(user)
        logger.info(
            f"Telegram OAuth: existing user {user.email} (ID: {user.id}) logged in via Telegram"
        )

    # Issue JWT tokens
    token_version = int(getattr(user, "token_version", 0) or 0)
    access_token = create_access_token(str(user.id), user.role, user.email, token_version)
    refresh_token = create_refresh_token(str(user.id), user.role, user.email, token_version)

    _set_refresh_cookie(response, refresh_token)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            role=user.role,
            settings=user.settings or {},
        ),
    )
