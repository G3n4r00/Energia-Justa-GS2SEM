from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Appliance
from ..schemas import ApplianceCreate, ApplianceOut, ApplianceUpdate

router = APIRouter(prefix="/appliances", tags=["appliances"])


@router.get("", response_model=list[ApplianceOut])
def list_appliances(db: Session = Depends(get_db)):
    return db.query(Appliance).order_by(Appliance.id).all()


@router.post("", response_model=ApplianceOut, status_code=201)
def create_appliance(body: ApplianceCreate, db: Session = Depends(get_db)):
    appliance = Appliance(**body.model_dump())
    db.add(appliance)
    db.commit()
    db.refresh(appliance)
    return appliance


@router.put("/{appliance_id}", response_model=ApplianceOut)
def update_appliance(
    appliance_id: int,
    body: ApplianceUpdate,
    db: Session = Depends(get_db),
):
    appliance = db.get(Appliance, appliance_id)
    if not appliance:
        raise HTTPException(status_code=404, detail="Aparelho não encontrado")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(appliance, field, value)
    db.commit()
    db.refresh(appliance)
    return appliance


@router.delete("/{appliance_id}", status_code=204)
def delete_appliance(appliance_id: int, db: Session = Depends(get_db)):
    appliance = db.get(Appliance, appliance_id)
    if not appliance:
        raise HTTPException(status_code=404, detail="Aparelho não encontrado")
    db.delete(appliance)
    db.commit()
