from dataclasses import dataclass


def custo_brl(power_w: float, daily_hours: float, ciclo_dias: int, tarifa: float) -> float:
    """Custo em R$ de um aparelho num ciclo. Função compartilhada com o recomendador."""
    return round((power_w / 1000.0) * daily_hours * ciclo_dias * tarifa, 4)


@dataclass
class ApplianceInput:
    id: int
    name: str
    power_w: float
    daily_hours: float
    is_active: bool
    category: str = ""


@dataclass
class ConsumptionItem:
    id: int
    name: str
    category: str
    kwh: float
    brl: float
    pct_of_total: float


@dataclass
class ConsumptionResult:
    total_kwh: float
    total_brl: float
    items: list[ConsumptionItem]


def calcular_consumo(
    aparelhos: list[ApplianceInput],
    tarifa_brl_kwh: float,
    ciclo_dias: int = 30,
) -> ConsumptionResult:
    items = []
    total_kwh = 0.0

    for a in aparelhos:
        if not a.is_active:
            continue
        kwh = round((a.power_w / 1000.0) * a.daily_hours * ciclo_dias, 3)
        total_kwh += kwh
        items.append(ConsumptionItem(id=a.id, name=a.name, category=a.category, kwh=kwh, brl=0.0, pct_of_total=0.0))

    total_kwh = round(total_kwh, 3)
    total_brl = round(total_kwh * tarifa_brl_kwh, 2)

    for item in items:
        item.brl = round(item.kwh * tarifa_brl_kwh, 2)
        item.pct_of_total = round(item.kwh / total_kwh * 100, 1) if total_kwh > 0 else 0.0

    return ConsumptionResult(total_kwh=total_kwh, total_brl=total_brl, items=items)
