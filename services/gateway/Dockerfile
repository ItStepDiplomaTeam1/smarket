FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --user -r requirements.txt



FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN useradd -u 8888 appuser && chown -R appuser:appuser /app

COPY --from=builder /root/.local /home/appuser/.local
COPY --from=builder /build /app

ENV PATH=/home/appuser/.local/bin:$PATH

COPY ./app /app/app

USER appuser

EXPOSE 8080

CMD ["granian", "--interface", "asgi", "--host", "0.0.0.0", "--port", "8080", "--workers", "2", "app.main:app"]
