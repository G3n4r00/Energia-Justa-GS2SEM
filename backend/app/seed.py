from datetime import date
from sqlalchemy.orm import Session
from .models import Appliance, HouseholdConfig, Tariff

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


def run_seed(db: Session) -> None:
    if db.query(Appliance).count() > 0:
        return

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

    db.commit()
