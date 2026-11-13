from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import httpx

from app.database import Base
from app.models import Tariff
from scripts.ingest_tariffs import refresh_tariff_if_stale

_HASH_A = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
_HASH_B = "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3"

_ROW_A = {
    "SigAgente": "ELETROPAULO",
    "DscSubGrupo": "B1",
    "DscModalidadeTarifaria": "Convencional",
    "DscClasse": "Residencial",
    "DscSubClasse": "Residencial",
    "DscDetalhe": "Não se aplica",
    "DscBaseTarifaria": "Tarifa de Aplicação",
    "VlrTE": "316,96",
    "VlrTUSD": "472,42",
    "DatInicioVigencia": "04/07/2026",
    "DatFimVigencia": "03/07/2027",
}

_ROW_B = {**_ROW_A, "VlrTE": "320,00", "DatInicioVigencia": "04/07/2027"}


def _make_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def _patch(hash_val=_HASH_A, row=_ROW_A):
    return (
        patch("scripts.ingest_tariffs.get_resource_hash", return_value=hash_val),
        patch("scripts.ingest_tariffs.fetch_tariff_row", return_value=row),
    )


# ── T10: ingestão válida via Datastore API ────────────────────────────────────

def test_T10_ingestao_valida():
    db = _make_db()
    p_hash, p_row = _patch()
    with p_hash, p_row:
        tariff = refresh_tariff_if_stale(db)

    assert tariff is not None
    assert tariff.is_demo is False
    assert tariff.source == "ANEEL"
    assert tariff.distributor == "Enel SP (Eletropaulo)"
    # (316,96 + 472,42) / 1000 = 0,78938 R$/kWh
    assert abs(tariff.rate_brl_kwh - 0.78938) < 0.0001
    assert tariff.import_run == _HASH_A
    assert tariff.effective_date is not None


# ── T11: mesmo hash não duplica ───────────────────────────────────────────────

def test_T11_idempotencia():
    db = _make_db()
    p_hash, p_row = _patch()
    with p_hash, p_row:
        t1 = refresh_tariff_if_stale(db)
        t2 = refresh_tariff_if_stale(db)

    assert t1.id == t2.id
    assert db.query(Tariff).filter(Tariff.is_demo == False).count() == 1


def test_T11_nova_publicacao_gera_nova_tarifa():
    db = _make_db()

    with patch("scripts.ingest_tariffs.get_resource_hash", return_value=_HASH_A), \
         patch("scripts.ingest_tariffs.fetch_tariff_row", return_value=_ROW_A):
        refresh_tariff_if_stale(db)

    with patch("scripts.ingest_tariffs.get_resource_hash", return_value=_HASH_B), \
         patch("scripts.ingest_tariffs.fetch_tariff_row", return_value=_ROW_B):
        refresh_tariff_if_stale(db)

    assert db.query(Tariff).filter(Tariff.is_demo == False).count() == 2


# ── T_offline: ANEEL indisponível não derruba a aplicação ────────────────────

def test_aneel_offline_retorna_none_sem_excecao():
    db = _make_db()
    with patch(
        "scripts.ingest_tariffs.get_resource_hash",
        side_effect=httpx.ConnectError("timeout"),
    ):
        result = refresh_tariff_if_stale(db)

    assert result is None
    assert db.query(Tariff).filter(Tariff.is_demo == False).count() == 0
