FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY services/auth_service/pyproject.toml ./pyproject.toml
RUN uv venv .venv && \
    uv pip install --no-cache -e .

FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY . .

RUN mkdir -p logs

EXPOSE 8001

CMD ["python", "main.py"]
