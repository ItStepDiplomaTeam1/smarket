from dotenv import load_dotenv
from pathlib import Path
import os

def find_env_file() -> Path | None:
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "pyproject.toml").exists():
            env_file = parent / ".env"
            if env_file.exists():
                return env_file
    return None

env_file = find_env_file()
if env_file is not None:
    load_dotenv(env_file)

def get_secret(outer_key: str) -> str:
    value = os.getenv(outer_key)
    if value is None:
        raise ValueError(f"Environment variable '{outer_key}' is not set")
    return value
