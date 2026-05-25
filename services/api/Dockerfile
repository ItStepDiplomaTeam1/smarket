FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY services/api/pyproject.toml ./pyproject.toml

RUN uv pip install --system --no-cache -r pyproject.toml

FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY services/api /app/services/api

WORKDIR /app/services/api

EXPOSE 8000