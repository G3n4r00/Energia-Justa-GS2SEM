from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .models import Appliance, HouseholdConfig, SensorReading, Tariff

_APPLIANCES = [
    {"name": "Geladeira Frost Free",       "power_w": 150.0,  "daily_hours": 24.0,  "is_protected": True,  "category": "cooling"},
    {"name": "Chuveiro elétrico",           "power_w": 5500.0, "daily_hours": 0.33,  "is_protected": False, "category": "heating"},
    {"name": "Ar-condicionado 9000 BTU",    "power_w": 900.0,  "daily_hours": 8.0,   "is_protected": False, "category": "cooling"},
    {"name": "Televisão 42\"",              "power_w": 80.0,   "daily_hours": 5.0,   "is_protected": False, "category": "entertainment"},
    {"name": "Máquina de lavar",            "power_w": 500.0,  "daily_hours": 1.0,   "is_protected": False, "category": "appliance"},
    {"name": "Microondas",                  "power_w": 1200.0, "daily_hours": 0.25,  "is_protected": False, "category": "cooking"},
    {"name": "Ferro elétrico",              "power_w": 1000.0, "daily_hours": 0.5,   "is_protected": False, "category": "appliance"},
    {"name": "Computador + monitor",        "power_w": 200.0,  "daily_hours": 8.0,   "is_protected": False, "category": "electronics"},
]

# Leituras de demonstração para o gráfico de telemetria do dashboard
_SEED_READINGS = [
    (6, 220.0, 1.04, 0.92),
    (5, 221.5, 0.92, 0.91),
    (4, 219.8, 1.15, 0.93),
    (3, 222.0, 0.88, 0.90),
    (2, 220.5, 1.22, 0.92),
    (1, 218.9, 0.95, 0.94),
    (0, 221.0, 1.08, 0.91),
]


def run_seed(db: Session) -> None:
    if db.query(Appliance).count() == 0:
        for data in _APPLIANCES:
            db.add(Appliance(**data))

    if db.query(HouseholdConfig).count() == 0:
        db.add(HouseholdConfig(budget_brl=200.0, cycle_days=30))

    if db.query(Tariff).count() == 0:
        db.add(Tariff(
            source="demonstrativo",
            distributor="Enel SP (Eletropaulo)",
            modality="B1 residencial convencional",
            rate_brl_kwh=0.789,
            effective_date=date(2026, 7, 4),
            is_demo=True,
            import_run="seed_v2",
        ))

    if db.query(SensorReading).count() == 0:
        now = datetime.now(timezone.utc)
        for days_ago, v, i, fp in _SEED_READINGS:
            ts = now - timedelta(days=days_ago)
            db.add(SensorReading(
                voltage_rms_v=v,
                current_rms_a=i,
                power_factor=fp,
                power_w=round(v * i * fp, 2),
                simulated=True,
                created_at=ts,
            ))

    db.commit()
