import sys

from loguru import logger


def setup_logging(level: str = "INFO", json_logs: bool = False) -> None:
    logger.remove()
    logger.add(
        sys.stdout,
        level=level.upper(),
        serialize=json_logs,
        enqueue=True,
        backtrace=True,
        diagnose=False,
        format=(
            "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level:<8} | "
            "{name}:{function}:{line} | {message} | extra={extra}"
        ),
    )
