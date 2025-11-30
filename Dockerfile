# Stage 1: Build Frontend

FROM node:20 AS build-frontend

WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Build Backend (uv)

FROM ghcr.io/astral-sh/uv:python3.12-bookworm AS backend

WORKDIR /app
COPY server/pyproject.toml server/uv.lock ./server/

RUN uv venv
RUN uv pip compile server/pyproject.toml --generate-hashes -o requirements.txt
RUN uv pip install -r requirements.txt
COPY server/ ./server

COPY --from=build-frontend /app/client/dist ./client/dist

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "server.fastapi_api.main:app", "--host", "0.0.0.0", "--port", "8000"]