from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.graph import router as graph_router
from app.api.chat import router as chat_router
from app.db.ingest import ingest_all
from app.services.graph_service import rebuild_graph
from app.config import DB_PATH
from app.db.database import get_schema_ddl

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DB_PATH.exists():
        print("Database not found. Ingesting data...")
        ingest_all()
    print("Building graph...")
    rebuild_graph()
    print("Ready.")
    yield


app = FastAPI(
    title="SAP O2C Graph Query System",
    description="Graph-based data modeling and natural language query interface for SAP Order-to-Cash data",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router)
app.include_router(chat_router)


@app.get("/api/schema")
def get_schema():
    return {"schema": get_schema_ddl()}


@app.get("/api/health")
def health():
    return {"status": "ok"}


if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
