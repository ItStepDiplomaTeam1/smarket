# Proposal: DevOps Infrastructure Hardening & CI/CD Optimization

## Executive Summary
This proposal addresses critical DevOps bottlenecks, resource contention, security flaws, and build failures in the Smarket infrastructure.

## Key Goals
1. **CI/CD Resource Isolation**: Prevent GitHub self-hosted runner from starving production containers on Hetzner (4GB RAM host).
2. **Safe Secret Ingestion**: Eliminate destructive `cat services/*/.env >> infra/.env` concatenation and unpredictable secret overwrites in `.github/workflows/ci.yml`.
3. **Dockerfile Standardization**: Fix case-sensitivity discrepancies (`DockerFile` vs `Dockerfile`) across `cart_service` and `product_service`.
4. **Healthcheck Optimization**: Reduce CPU overhead from repetitive Python interpreter spawns.
5. **Deployment Stability**: Ensure graceful service restarts without 502/503 outage spikes.

## Out of Scope
- Major architectural changes to backend business logic.
- Cloud database migrations away from PostgreSQL/MongoDB.
