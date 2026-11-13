from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..engine import custo_brl
from ..models import Appliance, HouseholdConfig, Plan, SensorReading, Tariff
from ..schemas import AnalyticsSeriesOut, AnalyticsSummaryOut, SeriesPointOut

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummaryOut)
def analytics_summary(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    config = db.query(HouseholdConfig).first()
    tariff = db.query(Tariff).order_by(Tariff.id.desc()).first()

    q = db.query(Appliance).filter(Appliance.is_active == True)
    if category:
        q = q.filter(Appliance.category == category)
    appliances = q.all()

    rate = tariff.rate_brl_kwh if tariff else 0.0
    cycle = config.cycle_days if config else 30
    budget = config.budget_brl if config else 0.0

    total_kwh = round(sum((a.power_w / 1000.0) * a.daily_hours * cycle for a in appliances), 3)
    total_brl = round(sum(custo_brl(a.power_w, a.daily_hours, cycle, rate) for a in appliances), 2)

    latest_plan = db.query(Plan).order_by(Plan.id.desc()).first()
    savings = latest_plan.savings_brl if latest_plan else 0.0

    return AnalyticsSummaryOut(
        total_kwh=total_kwh,
        total_brl=total_brl,
        budget_brl=budget,
        tariff_rate_brl_kwh=rate,
        appliance_count=len(appliances),
        savings_potential_brl=savings,
        category=category,
    )


@router.get("/series", response_model=AnalyticsSeriesOut)
def analytics_series(
    period_days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=period_days)
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.created_at >= cutoff)
        .order_by(SensorReading.created_at)
        .all()
    )

    by_date: dict[str, list[float]] = defaultdict(list)
    for r in readings:
        by_date[r.created_at.strftime("%Y-%m-%d")].append(r.power_w)

    points = [
        SeriesPointOut(
            date=d,
            avg_power_w=round(sum(vs) / len(vs), 2),
            readings_count=len(vs),
        )
        for d, vs in sorted(by_date.items())
    ]

    return AnalyticsSeriesOut(period_days=period_days, points=points)
