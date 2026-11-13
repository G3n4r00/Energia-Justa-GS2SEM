import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import health, appliances, config, consumption, tariffs, sensors, plans, analytics
from .database import create_tables, SessionLocal
from .seed import run_seed
from scripts.ingest_tariffs import refresh_tariff_if_stale


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    db = SessionLocal()
    try:
        run_seed(db)
        # asyncio.to_thread evita bloquear o event loop durante o I/O de startup.
        await asyncio.to_thread(refresh_tariff_if_stale, db)
    finally:
        db.close()
    yield


app = FastAPI(title="EnergiaJusta API", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(appliances.router)
app.include_router(config.router)
app.include_router(consumption.router)
app.include_router(tariffs.router)
app.include_router(sensors.router)
app.include_router(plans.router)
app.include_router(analytics.router)
