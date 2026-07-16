import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import ORJSONResponse
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.auth_service.database.models import User
from services.auth_service.database.session import get_db
from services.auth_service.plugins.checking.user import get_authenticated_user  # noqa: F401
from services.auth_service.plugins.security.auth_cache import invalidate_cached_auth_user

router = APIRouter(default_response_class=ORJSONResponse)


# ── Response schema ────────────────────────────────────────────────────────────


class AdminUserItem(BaseModel):
    id: str
    name: str
    email: str
    status: str
    created_at: str


# ── Internal helpers ──────────────────────────────────────────────────────────


def _require_admin_from_header(x_user_role: str | None) -> None:
    """Gateway already validates JWT; here we trust the X-User-Role header it injects."""
    if x_user_role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ заборонено. Потрібні права адміністратора.",
        )


def _format_user(user: User) -> AdminUserItem:
    name = user.email.split("@")[0] if "@" in user.email else user.email
    status_str = "Активний" if user.is_active else "Неактивний"

    if user.is_active and user.created_at:
        now = datetime.now(UTC)
        if now - user.created_at < timedelta(days=7):
            status_str = "Новий"

    created_iso = user.created_at.isoformat() if user.created_at else datetime.now(UTC).isoformat()
    return AdminUserItem(
        id=str(user.id),
        name=name,
        email=user.email,
        status=status_str,
        created_at=created_iso,
    )


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("/recent-users", response_model=list[AdminUserItem])
async def get_recent_users(
    limit: int = 5,
    x_user_role: str | None = Header(
        None, alias="X-User-Role"
    ),  # injected by Gateway after JWT validation
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the most recently registered users, ordered by created_at DESC.
    Only accessible by admins (role enforced at Gateway + double-checked here).
    """
    _require_admin_from_header(x_user_role)

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="limit must be between 1 and 100",
        )

    result = await db.execute(select(User).order_by(User.created_at.desc()).limit(limit))
    users = result.scalars().all()

    logger.info(f"Admin requested {limit} recent users — returned {len(users)} records")
    return [_format_user(u) for u in users]

@router.post("/users/{user_id}/block")
async def block_user(
    user_id: str,
    x_user_role: str | None = Header(None, alias="X-User-Role"),
    db: AsyncSession = Depends(get_db),
):
    _require_admin_from_header(x_user_role)
    try:
        uid = uuid.UUID(user_id)
    except ValueError as err:
        raise HTTPException(status_code=400, detail="Invalid user ID format") from err

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    user.is_active = False
    await db.commit()
    await invalidate_cached_auth_user(user.email)
    logger.info(f"Admin blocked user {user_id}")
    return {"status": "ok", "message": "Користувача заблоковано"}

@router.post("/users/{user_id}/unblock")
async def unblock_user(
    user_id: str,
    x_user_role: str | None = Header(None, alias="X-User-Role"),
    db: AsyncSession = Depends(get_db),
):
    _require_admin_from_header(x_user_role)
    try:
        uid = uuid.UUID(user_id)
    except ValueError as err:
        raise HTTPException(status_code=400, detail="Invalid user ID format") from err

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    user.is_active = True
    await db.commit()
    await invalidate_cached_auth_user(user.email)
    logger.info(f"Admin unblocked user {user_id}")
    return {"status": "ok", "message": "Користувача розблоковано"}
