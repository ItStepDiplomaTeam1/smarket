import uuid
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from loguru import logger
from pydantic import BaseModel

from app.agent.zephyros import agent
from app.config import settings
from app.deps import AgentDeps
from app.schemas import ZephyrosResponse
from pydantic_ai.exceptions import ModelHTTPError


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        timeout=30.0,
    )
    logger.info("Zephyros agent service started.")
    yield
    await app.state.http_client.aclose()
    logger.info("Zephyros agent service stopped.")


app = FastAPI(
    title="Zephyros AI Agent",
    version="0.1.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "zephyros_agent"}


@app.post("/agent/chat", response_model=ZephyrosResponse, tags=["Agent"])
async def chat(
    request: ChatRequest,
    x_user_id: str | None = Header(default=None),
) -> ZephyrosResponse:
    user_id: uuid.UUID | None = None
    if x_user_id:
        try:
            user_id = uuid.UUID(x_user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-User-Id format.")

    deps = AgentDeps(
        http_client=app.state.http_client,
        user_id=user_id,
    )

    try:
        result = await agent.run(request.message, deps=deps)
        return result.data
    except ModelHTTPError as e:
        logger.error(f"AI model error: status={e.status_code}, body={e.body}")
        raise HTTPException(
            status_code=503,
            detail=f"AI-модель недоступна: {e.body.get('message', str(e)) if isinstance(e.body, dict) else str(e)}",
        )
    except Exception as e:
        logger.error(f"Unexpected agent error: {e}")
        raise HTTPException(status_code=500, detail="Внутрішня помилка агента")
