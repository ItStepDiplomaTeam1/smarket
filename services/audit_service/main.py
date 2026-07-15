from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Depends, Query
from fastapi.responses import ORJSONResponse
from faststream.rabbit import RabbitBroker, RabbitExchange, RabbitQueue, ExchangeType
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from config import settings
from schemas import AuditEventMessage, AuditLogListResponse
from database import get_db, AsyncSessionLocal
from models import AuditLog

broker = RabbitBroker(settings.RABBITMQ_URL)

smarket_events = RabbitExchange("smarket_events", type=ExchangeType.TOPIC)
audit_queue = RabbitQueue("audit_queue", routing_key="#")


broker_startup_error = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global broker_startup_error
    # Намагаємося підключитися до RabbitMQ
    try:
        await broker.start()
        print("[OK] FastStream broker started successfully.")
    except Exception as e:
        broker_startup_error = str(e)
        print(f"[ERROR] Failed to start FastStream broker: {e}")
        print("Running without active RabbitMQ connection (consumers disabled).")
    
    yield
    
    await broker.close()
    print("[SHUTDOWN] FastStream broker connection closed.")



app = FastAPI(
    title="Audit Service",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)


@broker.subscriber(audit_queue, smarket_events)
async def handle_audit_event(event: AuditEventMessage):
    """
    Консюмер подій з RabbitMQ. Приймає повідомлення про життєвий цикл сервісів,
    валідує їх за допомогою AuditEventMessage та записує до бази даних.
    """
    print(f"[EVENT] Received event: {event.event_type} from {event.actor} - {event.message}")
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
        print("[DB] Event successfully saved to DB.")


@app.get("/admin/audit", response_model=AuditLogListResponse, tags=["Admin", "Audit Logs"])
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Отримання логів аудіювання з пагінацією, фільтрацією та повнотекстовим пошуком.
    """
    query = select(AuditLog)
    
    if severity:
        query = query.where(AuditLog.severity == severity)
    if event_type:
        query = query.where(AuditLog.event_type == event_type)
    if search:
        query = query.where(AuditLog.message.ilike(f"%{search}%"))
        
    # Рахуємо загальну кількість перед пагінацією
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Сортування та ліміти
    query = query.order_by(desc(AuditLog.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok" if broker_startup_error is None else "error",
        "service": "audit_service",
        "broker_connected": broker_startup_error is None,
        "broker_error": broker_startup_error
    }
