FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY services/auth_service/pyproject.toml ./pyproject.toml
RUN uv venv .venv && \
    uv pip install --no-cache -e .

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY services/auth_service/ ./services/auth_service/

RUN mkdir -p services/auth_service/logs

EXPOSE 8001

CMD ["granian", "--interface", "asgi", "--host", "0.0.0.0", "--port", "8001", "--workers", "2", "services.auth_service.main:app"]
