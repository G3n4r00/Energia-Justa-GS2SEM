"""
ETL de tarifas da ANEEL via CKAN Datastore API.

Em vez de baixar o CSV completo (155 MB), consulta diretamente o Datastore,
que retorna apenas os ~2 registros relevantes (~3 KB, < 1 s).

Change detection por hash MD5 do recurso: só importa quando a ANEEL publica
uma nova versão do dataset.

Uso:
    python -m scripts.ingest_tariffs
"""

import asyncio
import logging
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Optional

import httpx
from sqlalchemy.orm import Session

_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(_ROOT))

from app.database import SessionLocal, create_tables
from app.models import Tariff

logger = logging.getLogger(__name__)

# Recurso "tarifas-homologadas-distribuidoras-energia-eletrica" no portal ANEEL
_CKAN_BASE = "https://dadosabertos.aneel.gov.br/api/3/action"
_RESOURCE_ID = "fcf2906c-7c32-4b9b-a637-054e7a5234f4"

# Filtros exatos para Enel SP (Eletropaulo), B1 residencial convencional
# DscDetalhe "Não se aplica" exclui microgeração (SCEE)
_FILTERS = {
    "SigAgente": "ELETROPAULO",
    "DscSubGrupo": "B1",
    "DscModalidadeTarifaria": "Convencional",
    "DscClasse": "Residencial",
    "DscSubClasse": "Residencial",
    "DscDetalhe": "Não se aplica",
    "DscBaseTarifaria": "Tarifa de Aplicação",
}

_TIMEOUT_HASH = 10.0    # resource_show é leve
_TIMEOUT_DATA = 30.0    # datastore_search pode ser mais lento


def _parse_float(value) -> float:
    return float(str(value).replace(",", ".").strip())


def _parse_date(value: str) -> Optional[date]:
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(value).strip(), fmt).date()
        except ValueError:
            continue
    return None


def get_resource_hash(client: httpx.Client) -> Optional[str]:
    """Hash MD5 do recurso CKAN; muda a cada publicação semanal da ANEEL."""
    r = client.get(
        f"{_CKAN_BASE}/resource_show",
        params={"id": _RESOURCE_ID},
        timeout=_TIMEOUT_HASH,
    )
    r.raise_for_status()
    return r.json().get("result", {}).get("hash")


def fetch_tariff_row(client: httpx.Client) -> dict:
    """Registro mais recente via Datastore (~3 KB); nenhum download de CSV."""
    r = client.post(
        f"{_CKAN_BASE}/datastore_search",
        json={
            "resource_id": _RESOURCE_ID,
            "filters": _FILTERS,
            "sort": "DatInicioVigencia desc",
            "limit": 2,
        },
        timeout=_TIMEOUT_DATA,
    )
    r.raise_for_status()
    records = r.json().get("result", {}).get("records", [])
    if not records:
        raise ValueError(
            "Nenhum registro ELETROPAULO / B1 residencial convencional "
            "encontrado no Datastore da ANEEL. "
            "Verifique os filtros ou use a tarifa demonstrativa como fallback."
        )
    return records[0]


def refresh_tariff_if_stale(db: Session) -> Optional[Tariff]:
    """
    Verifica o hash do recurso CKAN e importa nova tarifa apenas se a ANEEL
    publicou uma versão mais recente desde a última importação.

    Retorna a Tariff gravada (nova ou já existente), ou None se a ANEEL
    estiver indisponível.
    """
    try:
        with httpx.Client() as client:
            remote_hash = get_resource_hash(client)

            if remote_hash:
                existing = (
                    db.query(Tariff)
                    .filter(Tariff.import_run == remote_hash, Tariff.is_demo == False)
                    .first()
                )
                if existing:
                    logger.info(
                        "[ETL] Tarifa já atualizada (hash %s…). Nada a fazer.",
                        remote_hash[:12],
                    )
                    return existing

            row = fetch_tariff_row(client)

    except httpx.HTTPError as exc:
        logger.warning("[ETL] ANEEL indisponível (%s); usando tarifa existente.", exc)
        return None
    except Exception as exc:
        logger.warning("[ETL] Erro inesperado ao consultar ANEEL: %s", exc)
        return None

    te   = _parse_float(row.get("VlrTE",   "0"))
    tusd = _parse_float(row.get("VlrTUSD", "0"))
    rate = round((te + tusd) / 1000.0, 6)
    eff_date = _parse_date(row.get("DatInicioVigencia"))

    tariff = Tariff(
        source="ANEEL",
        distributor="Enel SP (Eletropaulo)",
        modality="B1 residencial convencional",
        rate_brl_kwh=rate,
        effective_date=eff_date,
        is_demo=False,
        import_run=remote_hash,
    )
    db.add(tariff)
    db.commit()
    db.refresh(tariff)

    logger.info(
        "[ETL] Tarifa importada: R$ %.5f/kWh "
        "(TE=%.2f + TUSD=%.2f R$/MWh) vigência %s | hash %s…",
        rate, te, tusd, eff_date, (remote_hash or "")[:12],
    )
    return tariff


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    create_tables()
    db = SessionLocal()
    try:
        result = refresh_tariff_if_stale(db)
        if result:
            print(
                f"Tarifa vigente: R$ {result.rate_brl_kwh:.5f}/kWh | "
                f"vigência {result.effective_date} | "
                f"hash {(result.import_run or '')[:12]}…"
            )
        else:
            print("Sem atualização disponível ou ANEEL indisponível.")
    finally:
        db.close()
