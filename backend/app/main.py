from contextlib import asynccontextmanager
from fastapi import FastAPI
from .routers import health, appliances, config, consumption, tariffs
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
app.include_router(appliances.router)
app.include_router(config.router)
app.include_router(consumption.router)
app.include_router(tariffs.router)
