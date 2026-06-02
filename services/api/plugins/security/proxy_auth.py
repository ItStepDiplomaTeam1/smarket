"""
Dependency for extracting the authenticated user identity forwarded by the API Gateway.

The Gateway is solely responsible for JWT validation. After successful validation,
it MUST inject the `X-User-Id` header before proxying the request to this service.
If this header is absent, the request reached this service directly (bypassing the
Gateway), which is either an attack or a misconfiguration — we reject it hard.
"""

from fastapi import Header, HTTPException, status


async def get_current_user_id(
    x_user_id: str | None = Header(None, alias="X-User-Id"),
) -> str:
    """
    FastAPI dependency that returns the authenticated user's ID.

    Raises:
        HTTPException 403: If the `X-User-Id` header is missing (direct access without Gateway).
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Direct access denied. Use API Gateway.",
        )
    return x_user_id
