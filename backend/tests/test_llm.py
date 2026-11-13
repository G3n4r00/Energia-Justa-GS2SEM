"""
Testes para llm.py — valida fallback sem chave e endpoint /plans/{id}/explanation.
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def _criar_plano():
    """Helper: semeia dados mínimos e cria um plano via API."""
    from app.seed import run_seed
    db = TestingSessionLocal()
    run_seed(db)
    db.close()
    resp = client.post("/plans", json={"target_brl": 50.0})
    assert resp.status_code == 201
    return resp.json()["id"]


def test_T12_fallback_sem_chave():
    """explain_plan deve retornar texto de fallback quando GEMINI_API_KEY está vazio."""
    from app.llm import explain_plan
    with patch.dict("os.environ", {"GEMINI_API_KEY": ""}):
        texto = explain_plan({
            "status": "reached",
            "current_brl": 250.0,
            "projected_brl": 180.0,
            "savings_brl": 70.0,
            "items": [],
        })
    assert "R$ 250" in texto or "R$" in texto
    assert len(texto) > 20


def test_T13_endpoint_explanation_fallback():
    """GET /plans/{id}/explanation retorna 200 com texto de fallback quando sem chave LLM."""
    plan_id = _criar_plano()
    with patch.dict("os.environ", {"GEMINI_API_KEY": ""}):
        resp = client.get(f"/plans/{plan_id}/explanation")
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan_id"] == plan_id
    assert len(data["explanation"]) > 10


def test_T14_endpoint_explanation_404():
    """GET /plans/9999/explanation retorna 404 para plano inexistente."""
    resp = client.get("/plans/9999/explanation")
    assert resp.status_code == 404
