from dataclasses import dataclass, field
import uuid

import httpx


@dataclass
class AgentDeps:
    http_client: httpx.AsyncClient
    user_id: uuid.UUID | None = field(default=None)
