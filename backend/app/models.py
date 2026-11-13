from datetime import date, datetime, timezone
from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String
from .database import Base


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    power_w = Column(Float, nullable=False)
    daily_hours = Column(Float, nullable=False)
    is_protected = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    category = Column(String, nullable=False, default="other")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class HouseholdConfig(Base):
    __tablename__ = "household_config"

    id = Column(Integer, primary_key=True)
    budget_brl = Column(Float, nullable=False, default=200.0)
    cycle_days = Column(Integer, nullable=False, default=30)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Tariff(Base):
    __tablename__ = "tariffs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    distributor = Column(String, nullable=False)
    modality = Column(String, nullable=False)
    rate_brl_kwh = Column(Float, nullable=False)
    effective_date = Column(Date, nullable=True)
    # Tarifa real (ANEEL) tem is_demo=False; demonstrativa tem is_demo=True
    is_demo = Column(Boolean, default=False, nullable=False)
    import_run = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    voltage_rms_v = Column(Float, nullable=False)
    current_rms_a = Column(Float, nullable=False)
    power_factor = Column(Float, nullable=False)
    power_w = Column(Float, nullable=False)
    appliance_id = Column(Integer, nullable=True)
    simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
