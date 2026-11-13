"""
Testes para /analytics — T12 (filtro por categoria) e T13 (filtro temporal da serie).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.seed import run_seed


def _client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    db = Session()
    run_seed(db)
    db.close()

    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app)
    yield c
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    yield from _client()


def test_T12_filtro_categoria_muda_total(client):
    """Filtrar por categoria retorna custo menor que sem filtro."""
    total_all = client.get("/analytics/summary").json()["total_brl"]
    resp_cooling = client.get("/analytics/summary?category=cooling")
    assert resp_cooling.status_code == 200
    total_cooling = resp_cooling.json()["total_brl"]
    # cooling tem 2 aparelhos; total geral tem 8 → custo menor
    assert total_cooling < total_all
    assert resp_cooling.json()["category"] == "cooling"


def test_T12_filtro_categoria_conta_aparelhos(client):
    """appliance_count reflete somente a categoria filtrada."""
    resp = client.get("/analytics/summary?category=cooking")
    assert resp.status_code == 200
    # Seed tem 1 aparelho na categoria cooking (Microondas)
    assert resp.json()["appliance_count"] == 1


def test_T13_serie_retorna_period_days_correto(client):
    """period_days na resposta reflete o parâmetro enviado."""
    for p in [7, 14, 30]:
        resp = client.get(f"/analytics/series?period_days={p}")
        assert resp.status_code == 200
        assert resp.json()["period_days"] == p


def test_T13_serie_contem_leituras_seed(client):
    """Serie com period_days=30 inclui as leituras de seed (dos ultimos 7 dias)."""
    resp = client.get("/analytics/series?period_days=30")
    assert resp.status_code == 200
    points = resp.json()["points"]
    assert len(points) > 0, "Esperava ao menos um ponto (seed tem leituras dos últimos 7 dias)"


def test_T13_serie_period_invalido_retorna_422(client):
    """period_days=0 viola a restricao ge=1 e retorna 422."""
    resp = client.get("/analytics/series?period_days=0")
    assert resp.status_code == 422
