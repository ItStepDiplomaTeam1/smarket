from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4

class AuditLogEventSchema(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor: str
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)
    severity: str = "info"
    
class AuditLogResponse(BaseModel):
    id: int
    created_at: datetime
    actor: str
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    message: str
    details: Optional[Dict[str, Any]] = None
    severity: str
    
    model_config = ConfigDict(from_attributes=True)

class AuditLogPaginatedResponse(BaseModel):
    total: int
    items: list[AuditLogResponse]
