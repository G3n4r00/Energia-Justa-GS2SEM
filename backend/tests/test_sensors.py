from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# ── fixture de banco isolado ──────────────────────────────────────────────────

def _make_engine():
    return create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


def _client():
    engine = _make_engine()
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


import pytest

@pytest.fixture
def client():
    yield from _client()


# ── T02: P = V · I · FP ──────────────────────────────────────────────────────

def test_T02_calculo_potencia_ativa(client):
    # V=220V, I=1.2A, FP=0.866 → P = 228.624 W
    r = client.post("/sensors/readings", json={
        "voltage_rms_v": 220.0,
        "current_rms_a": 1.2,
        "power_factor": 0.866,
    })
    assert r.status_code == 201
    body = r.json()
    assert abs(body["power_w"] - 228.624) < 0.01
    assert body["simulated"] is True
    assert body["id"] is not None


# ── T08: validação de entrada retorna 422 ─────────────────────────────────────

def test_T08_tensao_zero_retorna_422(client):
    r = client.post("/sensors/readings", json={
        "voltage_rms_v": 0,
        "current_rms_a": 1.0,
        "power_factor": 0.92,
    })
    assert r.status_code == 422


def test_T08_fator_potencia_invalido_retorna_422(client):
    r = client.post("/sensors/readings", json={
        "voltage_rms_v": 220.0,
        "current_rms_a": 1.0,
        "power_factor": 1.5,
    })
    assert r.status_code == 422


# ── T09: persistência do evento ───────────────────────────────────────────────

def test_T09_leitura_persiste_e_recuperavel(client):
    client.post("/sensors/readings", json={
        "voltage_rms_v": 220.0,
        "current_rms_a": 2.0,
        "power_factor": 0.92,
    })

    r = client.get("/sensors/readings")
    assert r.status_code == 200
    readings = r.json()
    assert len(readings) == 1
    assert readings[0]["simulated"] is True
    assert abs(readings[0]["power_w"] - 404.8) < 0.01  # 220*2*0.92
