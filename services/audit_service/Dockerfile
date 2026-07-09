FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY services/audit_service/requirements.txt ./requirements.txt
RUN uv pip install --system --no-cache -r requirements.txt

# ── Runtime ───────────────────────────────────────────────────────────────────

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/services/audit_service

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY services/audit_service/ ./services/audit_service/

EXPOSE 8006

CMD ["sh", "-c", "cd /app/services/audit_service && granian --interface asgi --host 0.0.0.0 --port 8006 --workers 2 main:app"]
