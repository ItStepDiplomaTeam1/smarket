FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY services/reviews_service/requirements.txt ./requirements.txt
RUN uv pip install --system --no-cache -r requirements.txt

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/services/reviews_service

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY services/reviews_service/ ./services/reviews_service/

RUN mkdir -p services/reviews_service/logs

EXPOSE 8004

CMD ["sh", "-c", "cd services/reviews_service && alembic upgrade head && cd /app && granian --interface asgi --host 0.0.0.0 --port 8004 --workers 2 app.main:app"]
