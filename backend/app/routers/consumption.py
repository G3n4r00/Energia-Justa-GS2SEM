from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Appliance, HouseholdConfig, Tariff
from ..schemas import ConsumptionItemOut, ConsumptionSummaryOut
from ..engine import ApplianceInput, calcular_consumo

router = APIRouter(prefix="/consumption", tags=["consumption"])


@router.get("/summary", response_model=ConsumptionSummaryOut)
def consumption_summary(db: Session = Depends(get_db)):
    config = db.query(HouseholdConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")

    tariff = db.query(Tariff).order_by(Tariff.id.desc()).first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tarifa não encontrada")

    appliances = db.query(Appliance).all()
    inputs = [
        ApplianceInput(
            id=a.id,
            name=a.name,
            power_w=a.power_w,
            daily_hours=a.daily_hours,
            is_active=a.is_active,
        )
        for a in appliances
    ]

    result = calcular_consumo(inputs, tariff.rate_brl_kwh, config.cycle_days)

    return ConsumptionSummaryOut(
        total_kwh=result.total_kwh,
        total_brl=result.total_brl,
        budget_brl=config.budget_brl,
        cycle_days=config.cycle_days,
        tariff_rate_brl_kwh=tariff.rate_brl_kwh,
        tariff_is_demo=tariff.is_demo,
        items=[
            ConsumptionItemOut(
                id=i.id,
                name=i.name,
                kwh=i.kwh,
                brl=i.brl,
                pct_of_total=i.pct_of_total,
            )
            for i in sorted(result.items, key=lambda x: x.brl, reverse=True)
        ],
    )
