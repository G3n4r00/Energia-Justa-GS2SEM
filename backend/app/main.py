import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .routers import health, appliances, config, consumption, tariffs, sensors, plans
from .database import create_tables, SessionLocal
from .seed import run_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    db = SessionLocal()
    try:
        run_seed(db)
        # Verifica hash CKAN e importa nova tarifa se a ANEEL publicou atualização.
        # asyncio.to_thread evita bloquear o event loop durante o I/O de startup.
        from scripts.ingest_tariffs import refresh_tariff_if_stale
        await asyncio.to_thread(refresh_tariff_if_stale, db)
    finally:
        db.close()
    yield


app = FastAPI(title="EnergiaJusta API", version="0.2.0", lifespan=lifespan)

app.include_router(health.router)
app.include_router(appliances.router)
app.include_router(config.router)
app.include_router(consumption.router)
app.include_router(tariffs.router)
app.include_router(sensors.router)
app.include_router(plans.router)
