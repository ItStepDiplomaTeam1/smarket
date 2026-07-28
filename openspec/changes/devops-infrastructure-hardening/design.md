# Design: DevOps Infrastructure Hardening

## 1. Secret Pipeline Architecture

### Current Vulnerability
In `.github/workflows/ci.yml`:
```bash
cat services/*/.env >> infra/.env
sed -i "/^${var}=/d" .env
```
All service env files are dumped together into a single global `.env` file, causing variable collisions.

### Proposed Architecture
Doppler will inject individual secrets directly into each targeted service container or individual `services/<service>/.env` file without blanket concatenation:
```bash
# Keep services isolated
for service in auth_service cart_service product_service reviews_service gateway email_worker search_service zephyros_agent audit_service products_etl; do
    doppler secrets download --project smarket-services-secrets --config "dev_${service}" --format env > "services/${service}/.env"
done
```

---

## 2. Dockerfile Standardization

| Service | Current File Name | Target Standard File Name | Build Context |
|---|---|---|---|
| `cart_service` | `DockerFile` ❌ | `Dockerfile` ✅ | `.` |
| `product_service` | `DockerFile` ❌ | `Dockerfile` ✅ | `.` |
| `reviews_service` | `Dockerfile` ✅ | `Dockerfile` ✅ | `.` |
| `audit_service` | `Dockerfile` ✅ | `Dockerfile` ✅ | `.` |

---

## 3. Healthcheck Lightening

Replace heavy Python process invocations in `infra/docker-compose.yml`:
```yaml
# Before:
test: ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).read()\""]

# Optimized:
test: ["CMD-SHELL", "python -c \"import socket; s = socket.socket(); s.settimeout(2); s.connect(('127.0.0.1', 8000)); s.close()\""]
```

---

## 4. CI Runner & Deploy Strategy

* **Build Phase**: Execute Docker image builds (`docker buildx`) on `ubuntu-latest` GitHub runners to save Hetzner host CPU/RAM.
* **Deploy Phase**: Execute light SSH deployment (`docker compose pull && docker compose up -d --remove-orphans`) on Hetzner self-hosted runner.
