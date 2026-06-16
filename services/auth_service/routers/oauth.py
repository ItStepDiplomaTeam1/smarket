import os
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
from services.auth_service.shared.DTO import GoogleOAuthRequest, LoginResponse, UserResponse

router = APIRouter(
    prefix="/oauth",
    tags=["oauth"],
    default_response_class=ORJSONResponse,
)

_REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60
_COOKIE_SECURE = os.getenv("DEBUG", "False").lower() not in ("true", "1", "yes")
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

    logger.info(f"Google OAuth: запит від {email}")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=email,
            hashed_password="OAUTH_NO_PASSWORD",
            role="user",
            is_active=True,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.success(f"Google OAuth: новий користувач {email} зареєстрований, ID: {user.id}")
    else:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled",
            )
        logger.info(f"Google OAuth: існуючий користувач {email} (ID: {user.id}) увійшов")

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id), user.role)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax",
        max_age=_REFRESH_TOKEN_MAX_AGE,
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            role=user.role,
        ),
    )
