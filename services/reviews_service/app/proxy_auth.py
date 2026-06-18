"""
Dependency for extracting the authenticated user identity forwarded by the API Gateway.

The Gateway is solely responsible for JWT validation. After successful validation,
it MUST inject the `X-User-Id` and `X-User-Name` headers before proxying the request.
If these headers are absent, the request reached this service directly (bypassing the
Gateway), which is either an attack or a misconfiguration — we reject it hard.
"""

from fastapi import Header, HTTPException, status


async def get_current_user(
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    x_user_name: str | None = Header(None, alias="X-User-Name"),
) -> tuple[str, str]:
    """
    FastAPI dependency that returns the authenticated user's ID and name.

    Raises:
        HTTPException 403: If the `X-User-Id` header is missing (direct access without Gateway).
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Direct access denied. Use API Gateway.",
        )
    return x_user_id, x_user_name or "Користувач"
