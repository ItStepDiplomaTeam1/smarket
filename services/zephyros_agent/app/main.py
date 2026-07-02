import asyncio
import uuid
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from loguru import logger
from pydantic import BaseModel, ValidationError

from app.agent.zephyros import agent, get_agent_model
from app.config import settings
from app.deps import AgentDeps
from app.schemas import ZephyrosResponse
from pydantic_ai.exceptions import ModelHTTPError

_MAX_RETRIES = 3
_RETRY_DELAYS = [0.5, 1.5, 3.0]


def _clean_json(raw: str) -> str:
    """Strip optional markdown code fences from the model output."""
    text = raw.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


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
    provider: str | None = None
    model_name: str | None = None


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

    last_error: Exception | None = None

    for attempt in range(_MAX_RETRIES):
        try:
            current_model = get_agent_model(request.provider, request.model_name, attempt)
            logger.info(f"[attempt {attempt+1}/{_MAX_RETRIES}] Running agent with model: {current_model.model_name} (provider: {request.provider or 'auto'})")
            result = await agent.run(request.message, deps=deps, model=current_model)
            return ZephyrosResponse.model_validate_json(_clean_json(result.output))

        except ModelHTTPError as e:
            # 400 = bad prompt / tool schema mismatch — retry may help if model misbehaved
            # 401 = auth issue — no point retrying
            if e.status_code == 401:
                logger.error(f"[attempt {attempt+1}] Auth error from AI model: {e.body}")
                raise HTTPException(
                    status_code=503,
                    detail="AI-модель недоступна: невірний API-ключ.",
                )
            logger.warning(f"[attempt {attempt+1}/{_MAX_RETRIES}] Model HTTP error {e.status_code}: {e.body}")
            last_error = e

        except ValidationError as e:
            logger.warning(f"[attempt {attempt+1}/{_MAX_RETRIES}] JSON parse/validation failed: {e}")
            last_error = e

        except Exception as e:
            logger.warning(f"[attempt {attempt+1}/{_MAX_RETRIES}] Unexpected error: {e}")
            last_error = e

        if attempt < _MAX_RETRIES - 1:
            delay = _RETRY_DELAYS[attempt]
            logger.info(f"Retrying in {delay}s...")
            await asyncio.sleep(delay)

    logger.error(f"All {_MAX_RETRIES} attempts failed. Last error: {last_error}")
    raise HTTPException(status_code=503, detail="Агент не зміг опрацювати запит. Спробуйте ще раз.")

