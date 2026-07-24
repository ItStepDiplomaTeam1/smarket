from fastapi import Response

from services.auth_service.routers.auth import (
    _delete_refresh_cookie,
    _set_refresh_cookie,
)


def _set_cookie_header(response: Response) -> str:
    return response.headers["set-cookie"].lower()


def test_cross_site_refresh_cookie_uses_partitioned_storage(monkeypatch) -> None:
    monkeypatch.setenv("COOKIE_SAMESITE", "none")
    response = Response()

    _set_refresh_cookie(response, "refresh-token")

    header = _set_cookie_header(response)
    assert "refresh_token=refresh-token" in header
    assert "httponly" in header
    assert "secure" in header
    assert "samesite=none" in header
    assert "partitioned" in header
    assert "max-age=604800" in header
    assert "path=/" in header


def test_same_site_refresh_cookie_is_not_partitioned(monkeypatch) -> None:
    monkeypatch.setenv("COOKIE_SAMESITE", "lax")
    response = Response()

    _set_refresh_cookie(response, "refresh-token")

    header = _set_cookie_header(response)
    assert "samesite=lax" in header
    assert "partitioned" not in header


def test_cross_site_cookie_deletion_uses_same_partition(monkeypatch) -> None:
    monkeypatch.setenv("COOKIE_SAMESITE", "none")
    response = Response()

    _delete_refresh_cookie(response)

    header = _set_cookie_header(response)
    assert "refresh_token=" in header
    assert "max-age=0" in header
    assert "samesite=none" in header
    assert "partitioned" in header
