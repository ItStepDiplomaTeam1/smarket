from dotenv import load_dotenv
from pathlib import Path
import os

def find_env_file() -> Path:
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "pyproject.toml").exists():
            return parent / ".env"
    raise FileNotFoundError(".env not found")

load_dotenv(find_env_file())

def get_secret(outer_key: str) -> str:
    value = os.getenv(outer_key)
    if value is None:
        raise ValueError(f"Environment variable '{outer_key}' is not set")
    return value