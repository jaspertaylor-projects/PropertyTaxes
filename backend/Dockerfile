# backend/Dockerfile
# Purpose: Containerize the FastAPI backend with deterministic Python (3.12) so uv uses manylinux wheels (no compiling), preventing build failures on packages like httptools. Keeps baked venv and read-only data.
# Imports From: pyproject.toml, uv.lock, ./app/*, ./uvicorn-log.json
# Exported To: docker-compose services "backend" and any container platform (e.g., DigitalOcean).

FROM python:3.12-slim AS base

# Ensure uv/pip prefer the system Python 3.12 and prebuilt wheels
ENV PYTHONUNBUFFERED=1 \
    LOG_DIR=/logs \
    DATA_DIR=/app/app/data \
    UV_PYTHON_PREFER_SYSTEM=1 \
    UV_PYTHON=python3.12 \
    PIP_PREFER_BINARY=1

# Install curl for robust health checks, then uv
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir uv

# Non-root user for runtime
ARG UID=1000
ARG GID=1000
RUN groupadd -g "${GID}" app && useradd -m -u "${UID}" -g "${GID}" app

WORKDIR /app

# Lockfile + project metadata first to maximize layering
COPY pyproject.toml uv.lock* ./

# Prepare logs dir and ownership before switching users
RUN mkdir -p "${LOG_DIR}" && chown -R app:app "${LOG_DIR}" /app

USER app

# Create venv with the system Python 3.12 and install deps (frozen when possible)
# Pinning the interpreter here avoids uv fetching a newer CPython and then compiling C extensions.
RUN uv venv --python python3.12 && uv sync --frozen

# Bring in application code and logging config
COPY --chown=app:app ./app ./app
COPY --chown=app:app uvicorn-log.json ./uvicorn-log.json

# Harden baked-in data files as read-only inside the image (defense in depth)
# If DATA_DIR doesn't exist, don't fail the build.
RUN sh -lc 'if [ -d "$DATA_DIR" ]; then chmod -R a-w "$DATA_DIR"; fi'

EXPOSE 8000

# Production CMD — no '--reload'. Dev compose overrides with its own command including '--reload'.
CMD ["/app/.venv/bin/uvicorn", "app.bootstrap:asgi", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio", "--log-config", "/app/uvicorn-log.json"]