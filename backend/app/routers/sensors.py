from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SensorReading
from ..schemas import SensorReadingCreate, SensorReadingOut

router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.post("/readings", response_model=SensorReadingOut, status_code=201)
def create_reading(data: SensorReadingCreate, db: Session = Depends(get_db)):
    power_w = round(data.voltage_rms_v * data.current_rms_a * data.power_factor, 3)
    reading = SensorReading(
        voltage_rms_v=data.voltage_rms_v,
        current_rms_a=data.current_rms_a,
        power_factor=data.power_factor,
        power_w=power_w,
        appliance_id=data.appliance_id,
        simulated=True,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("/readings", response_model=list[SensorReadingOut])
def list_readings(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)):
    return db.query(SensorReading).order_by(SensorReading.id.desc()).limit(limit).all()
