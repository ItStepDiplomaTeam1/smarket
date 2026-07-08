FROM python:3.12-slim

WORKDIR /app

# Install build dependencies for asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY services/audit_service/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY services/audit_service/src/ ./src/
COPY services/audit_service/alembic.ini .
COPY services/audit_service/migrations/ ./migrations/

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8006"]
