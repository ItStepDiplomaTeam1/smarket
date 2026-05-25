import os

from dotenv import load_dotenv

load_dotenv()


def get_secret(outer_key: str) -> str:
    value = os.getenv(outer_key)
    if value is None:
        raise ValueError(f"Environment variable '{outer_key}' is not set")
    return value
