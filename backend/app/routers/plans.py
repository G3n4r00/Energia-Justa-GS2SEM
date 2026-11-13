from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Appliance, HouseholdConfig, Plan, PlanItem, Tariff
from ..recommender import gerar_plano
from ..schemas import PlanItemOut, PlanOut, PlanRequest

router = APIRouter(prefix="/plans", tags=["plans"])


def _load_plan(plan_id: int, db: Session) -> PlanOut:
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    items = db.query(PlanItem).filter(PlanItem.plan_id == plan.id).all()
    return PlanOut(
        id=plan.id,
        target_brl=plan.target_brl,
        current_brl=plan.current_brl,
        projected_brl=plan.projected_brl,
        savings_brl=plan.savings_brl,
        status=plan.status,
        created_at=plan.created_at,
        items=[PlanItemOut.model_validate(i) for i in items],
    )


@router.post("", response_model=PlanOut, status_code=201)
def create_plan(data: PlanRequest = PlanRequest(), db: Session = Depends(get_db)):
    config = db.query(HouseholdConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")

    tariff = db.query(Tariff).order_by(Tariff.id.desc()).first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tarifa não encontrada")

    meta = data.target_brl if data.target_brl is not None else config.budget_brl
    aparelhos = db.query(Appliance).all()

    result = gerar_plano(aparelhos, tariff.rate_brl_kwh, config.cycle_days, meta)

    plan = Plan(
        target_brl=result.target_brl,
        current_brl=result.current_brl,
        projected_brl=result.projected_brl,
        savings_brl=result.savings_brl,
        status=result.status,
    )
    db.add(plan)
    db.flush()

    for item in result.items:
        db.add(PlanItem(
            plan_id=plan.id,
            appliance_id=item.appliance_id,
            appliance_name=item.appliance_name,
            current_daily_hours=item.current_daily_hours,
            suggested_daily_hours=item.suggested_daily_hours,
            current_brl=item.current_brl,
            projected_brl=item.projected_brl,
            saving_brl=item.saving_brl,
        ))

    db.commit()
    return _load_plan(plan.id, db)


@router.get("", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).order_by(Plan.id.desc()).limit(10).all()
    return [_load_plan(p.id, db) for p in plans]


@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    return _load_plan(plan_id, db)
