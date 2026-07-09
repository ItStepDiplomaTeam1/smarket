from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

app = FastAPI(
    title="Audit Service",
    version="1.0.0",
    default_response_class=ORJSONResponse,
)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "audit_service"}
