from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Tariff
from ..schemas import TariffOut

router = APIRouter(prefix="/tariffs", tags=["tariffs"])


@router.get("", response_model=list[TariffOut])
def list_tariffs(db: Session = Depends(get_db)):
    return db.query(Tariff).order_by(Tariff.id.desc()).all()


@router.get("/active", response_model=TariffOut)
def active_tariff(db: Session = Depends(get_db)):
    tariff = db.query(Tariff).order_by(Tariff.id.desc()).first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Nenhuma tarifa cadastrada")
    return tariff


@router.post("/refresh")
def refresh_tariff(db: Session = Depends(get_db)):
    """
    Verifica o hash CKAN e importa nova tarifa se a ANEEL publicou atualização.
    Chamado pelo GitHub Actions no schedule semanal ou via workflow_dispatch.
    """
    from scripts.ingest_tariffs import refresh_tariff_if_stale
    tariff = refresh_tariff_if_stale(db)
    if tariff:
        return {
            "updated": True,
            "tariff_id": tariff.id,
            "rate_brl_kwh": tariff.rate_brl_kwh,
            "effective_date": str(tariff.effective_date),
            "import_run": (tariff.import_run or "")[:12] + "…",
        }
    return {"updated": False, "message": "Tarifa já atualizada ou ANEEL indisponível"}
