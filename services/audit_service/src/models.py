from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from src.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    actor = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    details = Column(JSONB, nullable=True, default={})
    severity = Column(String, nullable=False, default="info")

    __table_args__ = (
        Index("idx_audit_logs_created_at", created_at.desc()),
        Index("idx_audit_logs_event_type", event_type),
    )
