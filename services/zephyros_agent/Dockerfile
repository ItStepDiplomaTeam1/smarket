FROM python:3.11-slim

RUN groupadd --gid 1001 zephyros && \
    useradd --uid 1001 --gid zephyros --shell /bin/bash --create-home zephyros

WORKDIR /app

COPY services/zephyros_agent/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/zephyros_agent/app/ ./app/

USER zephyros

EXPOSE 8005

CMD ["granian", "--interface", "asgi", "--host", "0.0.0.0", "--port", "8005", "app.main:app"]
