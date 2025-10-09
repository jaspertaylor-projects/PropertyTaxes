# backend/Dockerfile
# Purpose: Containerize the FastAPI backend with production defaults and harden baked-in app data as read-only.
# Imports From: pyproject.toml, uv.lock, ./app/*, ./uvicorn-log.json
# Exported To: docker-compose services "backend" and any container platform (e.g., DigitalOcean).

FROM python:3.11-slim AS base

# Runtime defaults
ENV PYTHONUNBUFFERED=1 \
    LOG_DIR=/logs \
    DATA_DIR=/app/app/data

# uv manages virtualenv + sync; install once at image build time
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

# Create venv and install deps (frozen when possible)
RUN uv venv && uv sync --frozen

# Bring in application code and logging config
COPY --chown=app:app ./app ./app
COPY --chown=app:app uvicorn-log.json ./uvicorn-log.json

# Harden baked-in data files as read-only inside the image (defense in depth)
# If DATA_DIR doesn't exist, don't fail the build.
RUN sh -lc 'if [ -d "$DATA_DIR" ]; then chmod -R a-w "$DATA_DIR"; fi'

EXPOSE 8000

# Production CMD — no '--reload'. Dev compose overrides with its own command including '--reload'.
CMD ["uv", "run", "uvicorn", "app.bootstrap:asgi", "--host", "0.0.0.0", "--port", "8000", "--log-config", "/app/uvicorn-log.json"]
