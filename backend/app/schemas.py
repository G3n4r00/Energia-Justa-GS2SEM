from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional


class ApplianceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    power_w: float = Field(gt=0)
    daily_hours: float = Field(ge=0, le=24)
    is_protected: bool = False
    is_active: bool = True
    category: str = Field(default="other", max_length=50)


class ApplianceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    power_w: Optional[float] = Field(default=None, gt=0)
    daily_hours: Optional[float] = Field(default=None, ge=0, le=24)
    is_protected: Optional[bool] = None
    is_active: Optional[bool] = None
    category: Optional[str] = Field(default=None, max_length=50)


class ApplianceOut(BaseModel):
    id: int
    name: str
    power_w: float
    daily_hours: float
    is_protected: bool
    is_active: bool
    category: str

    model_config = {"from_attributes": True}


class HouseholdConfigOut(BaseModel):
    id: int
    budget_brl: float
    cycle_days: int

    model_config = {"from_attributes": True}


class HouseholdConfigUpdate(BaseModel):
    budget_brl: Optional[float] = Field(default=None, gt=0)
    cycle_days: Optional[int] = Field(default=None, ge=1, le=31)


class TariffOut(BaseModel):
    id: int
    source: str
    distributor: str
    modality: str
    rate_brl_kwh: float
    effective_date: Optional[date]
    is_demo: bool

    model_config = {"from_attributes": True}


class ConsumptionItemOut(BaseModel):
    id: int
    name: str
    kwh: float
    brl: float
    pct_of_total: float


class ConsumptionSummaryOut(BaseModel):
    total_kwh: float
    total_brl: float
    budget_brl: float
    cycle_days: int
    tariff_rate_brl_kwh: float
    tariff_is_demo: bool
    items: list[ConsumptionItemOut]
