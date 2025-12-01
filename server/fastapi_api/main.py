import os
from fastapi import FastAPI
from server.fastapi_api.routers import rankings
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ENV = os.getenv("ENV", "production")

app = FastAPI(
  title="Linear Algebra Power Rankings API",
  description="A REST API to generate power rankings based on user parameters",
  version="1.0.0"
)

origins =["http://localhost:5173", "http://0.0.0.0:8000", "https://linalg-power-rankings.fly.dev"]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(rankings.router, prefix="/rankings", tags=["Rankings"])

if ENV == "production":
  DIST_DIR = os.path.join(os.path.dirname(__file__), "../../client/dist")
  DIST_DIR = os.path.abspath(DIST_DIR)

  app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="static")

  @app.get("/{full_path:path}")
  async def serve_spa(full_path: str):
    return FileResponse(os.path.join(DIST_DIR, "index.html"))