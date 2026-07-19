# Zephyros AI Agent

Reliable shopping assistant for Smarket.

Zephyros builds shopping context once, returns deterministic cart/catalog answers
when possible, and races all eligible configured providers only when model
reasoning is needed. Provider attempts are read-only; cart and review writes use
one-time, user-bound action tokens after explicit confirmation.

The shopper never selects a provider or model. Configure provider credentials and
runtime limits through environment variables; see `.env.example`. Operational
rollout, diagnostics, metrics, and rollback guidance lives in `OPERATIONS.md`.
