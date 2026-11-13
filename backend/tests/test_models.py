from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Appliance, HouseholdConfig, Tariff
from app.seed import run_seed


def _make_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    return Session()


def test_tables_created_and_seed_runs():
    db = _make_db()
    run_seed(db)

    assert db.query(Appliance).count() == 8
    assert db.query(HouseholdConfig).count() == 1
    assert db.query(Tariff).count() == 1


def test_seed_is_idempotent():
    db = _make_db()
    run_seed(db)
    run_seed(db)

    assert db.query(Appliance).count() == 8


def test_geladeira_is_protected():
    db = _make_db()
    run_seed(db)

    geladeira = db.query(Appliance).filter(Appliance.name == "Geladeira Frost Free").first()
    assert geladeira is not None
    assert geladeira.is_protected is True


def test_demo_tariff_labeled():
    db = _make_db()
    run_seed(db)

    tariff = db.query(Tariff).first()
    assert tariff.is_demo is True
    assert tariff.rate_brl_kwh > 0
