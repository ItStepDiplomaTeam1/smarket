import pytest
import datetime
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from main import app
from database import get_db
from models import AuditLog

client = TestClient(app)

@pytest.fixture
def mock_db():
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    yield db
    app.dependency_overrides.clear()

@pytest.fixture
def mock_audit_log():
    return AuditLog(
        id=1,
        created_at=datetime.datetime.now(datetime.UTC),
        actor="auth_service",
        event_type="user_login",
        entity_type="user",
        entity_id="user-123",
        message="User logged in successfully",
        details={"ip": "127.0.0.1"},
        severity="info"
    )

@pytest.mark.asyncio
async def test_get_audit_logs_happy_path(mock_db, mock_audit_log):
    # Mock db.scalar to return total count of 1
    mock_db.scalar.return_value = 1
    
    # Mock db.execute to return result with mock_audit_log
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [mock_audit_log]
    mock_db.execute.return_value = mock_result

    response = client.get("/admin/audit?page=1&limit=20")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["page"] == 1
    assert data["limit"] == 20
    assert len(data["items"]) == 1
    assert data["items"][0]["actor"] == "auth_service"
    assert data["items"][0]["event_type"] == "user_login"

@pytest.mark.asyncio
async def test_get_audit_logs_severity_filter(mock_db, mock_audit_log):
    mock_db.scalar.return_value = 1
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [mock_audit_log]
    mock_db.execute.return_value = mock_result

    response = client.get("/admin/audit?severity=info")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    # Verify mock_db.scalar was called with a query containing the severity filter
    call_args = mock_db.scalar.call_args[0][0]
    # Check that query compiled text includes the severity filter clause
    compiled_query = str(call_args.compile())
    assert "severity" in compiled_query

@pytest.mark.asyncio
async def test_get_audit_logs_event_type_filter(mock_db, mock_audit_log):
    mock_db.scalar.return_value = 1
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [mock_audit_log]
    mock_db.execute.return_value = mock_result

    response = client.get("/admin/audit?event_type=user_login")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    call_args = mock_db.scalar.call_args[0][0]
    compiled_query = str(call_args.compile())
    assert "event_type" in compiled_query

@pytest.mark.asyncio
async def test_get_audit_logs_search_filter(mock_db, mock_audit_log):
    mock_db.scalar.return_value = 1
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [mock_audit_log]
    mock_db.execute.return_value = mock_result

    response = client.get("/admin/audit?search=success")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    call_args = mock_db.scalar.call_args[0][0]
    compiled_query = str(call_args.compile())
    assert "message" in compiled_query

@pytest.mark.asyncio
async def test_get_audit_logs_page_beyond_result_set(mock_db):
    mock_db.scalar.return_value = 5 # 5 total logs in DB
    
    # For page=999, offset is (999-1)*20 = 19960, returns empty list
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = []
    mock_db.execute.return_value = mock_result

    response = client.get("/admin/audit?page=999&limit=20")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert data["page"] == 999
    assert data["limit"] == 20
    assert len(data["items"]) == 0
