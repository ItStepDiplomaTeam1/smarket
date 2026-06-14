
import asyncio
import json
import logging
import time

import asyncpg

logger = logging.getLogger(__name__)


async def _on_products_updated(
    connection: asyncpg.Connection,
    pid: int,
    channel: str,
    payload: str,
) -> None:
    try:
        data = json.loads(payload)
        store_id = data.get("store_id", "unknown")
        sent_ts = data.get("ts", 0)
        lag_ms = int((time.time() - sent_ts) * 1000) if sent_ts else -1

        logger.info(
            "[PgListener] 📨 products_updated | store_id=%s | lag=%dms | pid=%d",
            store_id,
            lag_ms,
            pid,
        )

        # TODO: якщо хтось з нас додасть редіс, то потрібно інвалідувати кеш:
        # await redis_client.delete(f"products:store:{store_id}:*")

    except (json.JSONDecodeError, Exception) as exc:
        logger.warning("[PgListener] Не вдалось обробити payload %r: %s", payload, exc)


async def run_pg_listener(dsn: str) -> None:
    backoff = 1
    max_backoff = 60

    while True:
        conn: asyncpg.Connection | None = None
        try:
            logger.info("[PgListener] Підключення до PostgreSQL...")
            conn = await asyncpg.connect(dsn, timeout=10)

            await conn.add_listener("products_updated", _on_products_updated)
            logger.info("[PgListener] ✅ LISTEN products_updated — очікуємо нотифікацій.")

            backoff = 1

            while not conn.is_closed():
                await asyncio.sleep(5)

        except asyncio.CancelledError:
            logger.info("[PgListener] Отримано CancelledError — завершуємо роботу.")
            break

        except (asyncpg.PostgresConnectionStatusError, OSError, ConnectionRefusedError) as exc:
            logger.warning(
                "[PgListener] З'єднання перервано: %s. Reconnect через %ds...",
                exc,
                backoff,
            )
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, max_backoff)

        except Exception as exc:
            logger.error("[PgListener] Неочікувана помилка: %s. Reconnect через %ds...", exc, backoff)
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, max_backoff)

        finally:
            if conn and not conn.is_closed():
                try:
                    await conn.remove_listener("products_updated", _on_products_updated)
                    await conn.close()
                except Exception:
                    pass
