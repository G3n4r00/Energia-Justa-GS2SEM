from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Appliance
from app.recommender import gerar_plano
from app.seed import run_seed

TARIFA = 0.789
CICLO = 30


# ── helpers ───────────────────────────────────────────────────────────────────

def _aparelho(id, name, power_w, daily_hours, is_protected=False, is_active=True):
    a = Appliance()
    a.id = id
    a.name = name
    a.power_w = power_w
    a.daily_hours = daily_hours
    a.is_protected = is_protected
    a.is_active = is_active
    a.category = "other"
    return a


def _make_client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    db = Session()
    run_seed(db)
    db.close()

    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


import pytest

@pytest.fixture
def client():
    yield from _make_client()


# ── T05: aparelho protegido nunca entra no plano ──────────────────────────────

def test_T05_protegido_nao_e_sugerido():
    geladeira = _aparelho(1, "Geladeira", 150, 24, is_protected=True)
    chuveiro  = _aparelho(2, "Chuveiro",  5500, 0.33, is_protected=False)
    ac        = _aparelho(3, "AC",        900, 8, is_protected=False)

    resultado = gerar_plano([geladeira, chuveiro, ac], TARIFA, CICLO, meta_brl=10.0)

    ids_sugeridos = [i.appliance_id for i in resultado.items]
    assert 1 not in ids_sugeridos, "Geladeira protegida não deve aparecer no plano"


# ── T06: meta alcançável retorna status reached ───────────────────────────────

def test_T06_meta_alcancavel():
    ac = _aparelho(1, "AC", 900, 8)
    pc = _aparelho(2, "PC", 200, 8)

    custo_total = sum(
        (a.power_w / 1000) * a.daily_hours * CICLO * TARIFA for a in [ac, pc]
    )
    meta = round(custo_total * 0.6, 2)  # reduzir 40%

    resultado = gerar_plano([ac, pc], TARIFA, CICLO, meta_brl=meta)

    assert resultado.status == "reached"
    assert resultado.projected_brl <= meta + 0.02
    assert len(resultado.items) > 0
    assert resultado.savings_brl > 0


# ── T07: meta inalcançável retorna status not_reached ─────────────────────────

def test_T07_meta_inalcancavel():
    geladeira = _aparelho(1, "Geladeira", 150, 24, is_protected=True)
    tv        = _aparelho(2, "TV", 80, 3, is_protected=False)

    # Custo da TV é pequeno; mesmo desligando não atinge meta de R$1
    resultado = gerar_plano([geladeira, tv], TARIFA, CICLO, meta_brl=1.0)

    assert resultado.status == "not_reached"
    assert resultado.projected_brl > 1.0


# ── teste de endpoint via HTTP ────────────────────────────────────────────────

def test_post_plans_retorna_plano(client):
    r = client.post("/plans", json={})
    assert r.status_code == 201
    body = r.json()
    assert "status" in body
    assert body["status"] in ("reached", "not_reached")
    assert "items" in body
    assert body["current_brl"] > 0
