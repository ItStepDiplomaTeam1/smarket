from dataclasses import dataclass, field
import typing
import uuid

import httpx


@dataclass
class AgentDeps:
    http_client: httpx.AsyncClient
    user_id: uuid.UUID | None = field(default=None)
    redis_client: typing.Any | None = field(default=None)
