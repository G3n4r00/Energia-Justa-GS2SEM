"""
ETL: ingere o CSV de tarifas de aplicação da ANEEL e persiste no banco.

Uso:
    python -m scripts.ingest_tariffs <caminho_para_csv>

Saída esperada do ANEEL:
    "Tarifas de fornecimento — Tarifa de Aplicação"
    Separador ponto-e-vírgula; decimais com vírgula; encoding UTF-8 ou Latin-1.
    Colunas relevantes: NomAgente, DatInicioVigencia, SigModalidadeTarifaria,
    NomSubGrupo, VlrTE, VlrTUSD.

Critério de seleção: Enel SP, B1 residencial convencional.
Fallback: se não encontrar, sinaliza claramente e não insere dados.
"""

import hashlib
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Optional

import pandas as pd
from sqlalchemy.orm import Session

# Permite rodar de dentro de backend/ ou da raiz do monorepo
_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(_ROOT))

from app.database import SessionLocal, create_tables
from app.models import Tariff


# ── constantes de seleção ─────────────────────────────────────────────────────

_AGENT_KEYWORDS = ["ENEL", "SAO PAULO"]   # sem acento para tolerância
_MODALITY = "B1"
_SUBGROUP_KEYWORDS = ["RESIDENCIAL"]


# ── helpers ───────────────────────────────────────────────────────────────────

def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _parse_float(value: str) -> float:
    return float(str(value).replace(",", ".").strip())


def _parse_date(value: str) -> Optional[date]:
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(value).strip(), fmt).date()
        except ValueError:
            continue
    return None


def _load_csv(path: Path) -> pd.DataFrame:
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            df = pd.read_csv(path, sep=";", encoding=enc, dtype=str)
            if len(df.columns) > 2:
                return df
        except Exception:
            continue
    raise ValueError(f"Não foi possível ler o CSV: {path}")


def _find_row(df: pd.DataFrame) -> Optional[pd.Series]:
    # Normaliza nomes de colunas
    df.columns = [c.strip() for c in df.columns]

    agent_col = next((c for c in df.columns if "NomAgente" in c or "NoMAgente" in c), None)
    modal_col = next((c for c in df.columns if "Modalidade" in c or "MODALIDADE" in c.upper()), None)
    sub_col   = next((c for c in df.columns if "SubGrupo" in c or "SUBGRUPO" in c.upper()), None)
    te_col    = next((c for c in df.columns if c.strip() in ("VlrTE", "TE")), None)
    tusd_col  = next((c for c in df.columns if c.strip() in ("VlrTUSD", "TUSD")), None)
    date_col  = next((c for c in df.columns if "InicioVigencia" in c or "Inicio" in c), None)

    missing = [n for n, c in [("NomAgente", agent_col), ("Modalidade", modal_col),
                               ("VlrTE", te_col), ("VlrTUSD", tusd_col)] if c is None]
    if missing:
        raise ValueError(f"Colunas não encontradas no CSV: {missing}")

    mask = pd.Series([True] * len(df))

    # Filtro por distribuidora
    agent_upper = df[agent_col].str.upper().str.replace("[^A-Z ]", "", regex=True)
    for kw in _AGENT_KEYWORDS:
        mask &= agent_upper.str.contains(kw, na=False)

    # Filtro por modalidade
    mask &= df[modal_col].str.strip().str.upper() == _MODALITY

    # Filtro por subgrupo (quando coluna existe)
    if sub_col:
        sub_upper = df[sub_col].str.upper()
        sub_mask = pd.Series([False] * len(df))
        for kw in _SUBGROUP_KEYWORDS:
            sub_mask |= sub_upper.str.contains(kw, na=False)
        mask &= sub_mask

    filtered = df[mask]
    if filtered.empty:
        return None

    # Usa a primeira linha com vigência mais recente
    if date_col:
        filtered = filtered.copy()
        filtered["_date"] = filtered[date_col].apply(_parse_date)
        filtered = filtered.sort_values("_date", ascending=False)

    row = filtered.iloc[0]
    return row, te_col, tusd_col, date_col


def ingest(csv_path: Path, db: Session) -> Tariff:
    file_hash = _sha256(csv_path)

    # Idempotência: mesma importação não duplica
    existing = db.query(Tariff).filter(Tariff.import_run == file_hash).first()
    if existing:
        print(f"[ETL] Arquivo já importado (SHA-256: {file_hash[:12]}…). Nada a fazer.")
        return existing

    df = _load_csv(csv_path)
    result = _find_row(df)

    if result is None:
        raise ValueError(
            "Nenhuma linha Enel SP / B1 residencial encontrada. "
            "Verifique o CSV ou use tarifa demonstrativa como fallback."
        )

    row, te_col, tusd_col, date_col = result
    te   = _parse_float(row[te_col])
    tusd = _parse_float(row[tusd_col])
    rate = round((te + tusd) / 1000.0, 6)

    eff_date = _parse_date(row[date_col]) if date_col else None

    tariff = Tariff(
        source="ANEEL",
        distributor="Enel SP",
        modality="B1 residencial convencional",
        rate_brl_kwh=rate,
        effective_date=eff_date,
        is_demo=False,
        import_run=file_hash,
    )
    db.add(tariff)
    db.commit()
    db.refresh(tariff)

    print(
        f"[ETL] Tarifa importada: R$ {rate:.4f}/kWh "
        f"(TE={te} + TUSD={tusd} R$/MWh) "
        f"vigência {eff_date} | SHA-256: {file_hash[:12]}…"
    )
    return tariff


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python -m scripts.ingest_tariffs <caminho_csv>")
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"Arquivo não encontrado: {csv_path}")
        sys.exit(1)

    create_tables()
    db = SessionLocal()
    try:
        ingest(csv_path, db)
    finally:
        db.close()
