from fastapi import APIRouter, Depends
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
    from fastapi import HTTPException
    tariff = db.query(Tariff).order_by(Tariff.id.desc()).first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Nenhuma tarifa cadastrada")
    return tariff
