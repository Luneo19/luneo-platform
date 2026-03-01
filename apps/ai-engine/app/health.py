"""Basic health primitives for AI engine baseline."""


def healthcheck() -> dict[str, str]:
    """Return a deterministic service status payload."""
    return {"status": "ok", "service": "ai-engine"}
