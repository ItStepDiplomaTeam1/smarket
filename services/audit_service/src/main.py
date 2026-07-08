from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Query
from fastapi.responses import ORJSONResponse
from faststream.rabbit import RabbitBroker, RabbitExchange, RabbitQueue
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional

from src.config import settings
from src.schemas import AuditLogEventSchema, AuditLogPaginatedResponse, AuditLogResponse
from src.database import get_db, AsyncSessionLocal
from src.models import AuditLog

broker = RabbitBroker(settings.RABBITMQ_URL)

smarket_events = RabbitExchange("smarket_events", type="topic")
audit_queue = RabbitQueue("audit_queue", routing_key="#")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await broker.connect()
    yield
    await broker.close()

app = FastAPI(
    title="Audit Service",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan
)

@broker.subscriber(audit_queue, smarket_events)
async def handle_audit_event(event: AuditLogEventSchema):
    async with AsyncSessionLocal() as db:
        new_log = AuditLog(
            actor=event.actor,
            event_type=event.event_type,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            message=event.message,
            details=event.details,
            severity=event.severity
        )
        db.add(new_log)
        await db.commit()

@app.get("/admin/audit", response_model=AuditLogPaginatedResponse, tags=["Audit Logs"])
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog)
    
    if severity:
        query = query.where(AuditLog.severity == severity)
    if event_type:
        query = query.where(AuditLog.event_type == event_type)
    if search:
        query = query.where(AuditLog.message.ilike(f"%{search}%"))
        
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    query = query.order_by(desc(AuditLog.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return {"total": total or 0, "items": items}

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Audit service"}
