from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import Tariff
from scripts.ingest_tariffs import ingest

FIXTURE = Path(__file__).parent / "fixtures" / "tariffs_sample.csv"


def _make_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


# ── T10: ingestão válida ──────────────────────────────────────────────────────

def test_T10_ingestao_valida():
    db = _make_db()
    tariff = ingest(FIXTURE, db)

    assert tariff.id is not None
    assert tariff.is_demo is False
    assert tariff.source == "ANEEL"
    assert tariff.distributor == "Enel SP"
    # (TE=358,50 + TUSD=520,30) / 1000 = 0,87880 R$/kWh
    assert abs(tariff.rate_brl_kwh - 0.87880) < 0.0001
    assert tariff.effective_date is not None
    assert tariff.import_run is not None


# ── T11: reexecução não duplica ───────────────────────────────────────────────

def test_T11_idempotencia():
    db = _make_db()

    t1 = ingest(FIXTURE, db)
    t2 = ingest(FIXTURE, db)

    assert t1.id == t2.id
    assert db.query(Tariff).count() == 1


def test_T11_dois_arquivos_diferentes_geram_duas_tarifas(tmp_path):
    db = _make_db()

    # Cria uma cópia com conteúdo levemente diferente
    original = FIXTURE.read_text(encoding="utf-8")
    alt = tmp_path / "tariffs_alt.csv"
    alt.write_text(original.replace("358,50", "360,00"), encoding="utf-8")

    ingest(FIXTURE, db)
    ingest(alt, db)

    assert db.query(Tariff).filter(Tariff.source == "ANEEL").count() == 2
