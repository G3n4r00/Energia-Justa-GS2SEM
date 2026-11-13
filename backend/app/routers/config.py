from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import HouseholdConfig
from ..schemas import HouseholdConfigOut, HouseholdConfigUpdate
from datetime import datetime, timezone

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=HouseholdConfigOut)
def get_config(db: Session = Depends(get_db)):
    config = db.query(HouseholdConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    return config


@router.put("", response_model=HouseholdConfigOut)
def update_config(body: HouseholdConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(HouseholdConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(config, field, value)
    config.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(config)
    return config
