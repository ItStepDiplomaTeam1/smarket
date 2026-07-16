from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, Union
from datetime import datetime, timezone


class AuditEventMessage(BaseModel):
    """
    Схема повідомлення, що приходить з RabbitMQ від мікросервісів.
    
    event_id може бути:
      - UUID-рядком (Python-сервіси: auth, product, cart, reviews)
      - int64 числом (Go-сервіс: products_etl)
    """
    event_id: Union[str, int]
    timestamp: datetime
    actor: str
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)
    severity: str = "info"

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str) -> str:
        allowed = {"info", "warning", "error", "critical"}
        return v if v in allowed else "info"


class AuditLogResponse(BaseModel):
    """Схема для відповіді REST API — один запис аудит-логу."""
    id: int
    created_at: datetime
    actor: str
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    message: str
    details: Optional[Dict[str, Any]] = None
    severity: str

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """Схема для пагінованого списку аудит-логів."""
    total: int
    page: int
    limit: int
    items: list[AuditLogResponse]
