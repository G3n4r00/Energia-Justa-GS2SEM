import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.engine import ApplianceInput, calcular_consumo
from app.seed import run_seed


# ── helpers ──────────────────────────────────────────────────────────────────

def _make_engine():
    # StaticPool: todas as sessões compartilham a mesma conexão em memória
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return engine


def _client_with_seed():
    engine = _make_engine()
    Session = sessionmaker(bind=engine)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    db = Session()
    run_seed(db)
    db.close()

    app.dependency_overrides[get_db] = override_db
    return TestClient(app)


# ── T01: cálculo de consumo — caso de referência 12 kWh ──────────────────────

def test_T01_calculo_12kwh():
    # 400 W × 1 h/dia × 30 dias = 12 kWh
    aparelhos = [ApplianceInput(id=1, name="Teste", power_w=400.0, daily_hours=1.0, is_active=True)]
    result = calcular_consumo(aparelhos, tarifa_brl_kwh=1.0, ciclo_dias=30)

    assert result.total_kwh == 12.0
    assert result.total_brl == 12.0
    assert result.items[0].kwh == 12.0


# ── T04: reduzir horas reduz custo proporcionalmente ─────────────────────────

def test_T04_reducao_de_horas():
    aparelhos_base = [ApplianceInput(id=1, name="AC", power_w=900.0, daily_hours=8.0, is_active=True)]
    aparelhos_reduz = [ApplianceInput(id=1, name="AC", power_w=900.0, daily_hours=4.0, is_active=True)]

    base = calcular_consumo(aparelhos_base, tarifa_brl_kwh=0.85, ciclo_dias=30)
    reduz = calcular_consumo(aparelhos_reduz, tarifa_brl_kwh=0.85, ciclo_dias=30)

    assert reduz.total_kwh == pytest.approx(base.total_kwh / 2, rel=1e-3)
    assert reduz.total_brl < base.total_brl


# ── T08 parcial: validação 422 — power_w inválido ────────────────────────────

def test_T08_power_w_zero_retorna_422():
    client = _client_with_seed()
    response = client.post("/appliances", json={
        "name": "Aparelho Inválido",
        "power_w": 0,
        "daily_hours": 2.0,
    })
    assert response.status_code == 422


def test_T08_daily_hours_acima_de_24_retorna_422():
    client = _client_with_seed()
    response = client.post("/appliances", json={
        "name": "Aparelho Inválido",
        "power_w": 100.0,
        "daily_hours": 25.0,
    })
    assert response.status_code == 422


# ── endpoints básicos ─────────────────────────────────────────────────────────

def test_list_appliances_retorna_seed():
    client = _client_with_seed()
    response = client.get("/appliances")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8
    nomes = [a["name"] for a in data]
    assert "Geladeira Frost Free" in nomes


def test_consumption_summary_retorna_totais():
    client = _client_with_seed()
    response = client.get("/consumption/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_kwh"] > 0
    assert data["total_brl"] > 0
    assert data["tariff_is_demo"] is True
    assert len(data["items"]) > 0


def test_config_get_retorna_defaults():
    client = _client_with_seed()
    response = client.get("/config")
    assert response.status_code == 200
    data = response.json()
    assert data["budget_brl"] == 200.0
    assert data["cycle_days"] == 30
