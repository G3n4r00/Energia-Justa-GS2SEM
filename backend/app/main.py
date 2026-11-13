from contextlib import asynccontextmanager
from fastapi import FastAPI
from .routers import health
from .database import create_tables, SessionLocal
from .seed import run_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="EnergiaJusta API", version="0.1.0", lifespan=lifespan)

app.include_router(health.router)
