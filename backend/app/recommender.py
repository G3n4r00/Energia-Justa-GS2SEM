"""
Motor de recomendação de plano de economia.

Estratégia: ranqueia aparelhos ativos e não protegidos por custo decrescente.
Para cada candidato, sugere desligamento completo ou redução parcial de horas
até a meta ser atingida. Aparelhos protegidos nunca aparecem nas sugestões.
"""

from dataclasses import dataclass, field
from typing import Optional

from .engine import custo_brl
from .models import Appliance


@dataclass
class PlanItem:
    appliance_id: int
    appliance_name: str
    current_daily_hours: float
    suggested_daily_hours: float
    current_brl: float
    projected_brl: float
    saving_brl: float


@dataclass
class PlanResult:
    target_brl: float
    current_brl: float
    projected_brl: float
    savings_brl: float
    status: str  # "reached" | "not_reached"
    items: list[PlanItem] = field(default_factory=list)


def gerar_plano(
    aparelhos: list[Appliance],
    tarifa_brl_kwh: float,
    ciclo_dias: int,
    meta_brl: float,
) -> PlanResult:
    ativos = [a for a in aparelhos if a.is_active]
    custo_atual = sum(custo_brl(a.power_w, a.daily_hours, ciclo_dias, tarifa_brl_kwh) for a in ativos)

    if custo_atual <= meta_brl:
        return PlanResult(
            target_brl=meta_brl,
            current_brl=round(custo_atual, 2),
            projected_brl=round(custo_atual, 2),
            savings_brl=0.0,
            status="reached",
        )

    candidatos = sorted(
        [a for a in ativos if not a.is_protected and a.daily_hours > 0],
        key=lambda a: custo_brl(a.power_w, a.daily_hours, ciclo_dias, tarifa_brl_kwh),
        reverse=True,
    )

    economia_max = sum(
        custo_brl(a.power_w, a.daily_hours, ciclo_dias, tarifa_brl_kwh) for a in candidatos
    )
    economia_necessaria = custo_atual - meta_brl

    items: list[PlanItem] = []
    economia_acumulada = 0.0

    for a in candidatos:
        custo_a = custo_brl(a.power_w, a.daily_hours, ciclo_dias, tarifa_brl_kwh)
        faltante = economia_necessaria - economia_acumulada

        if custo_a <= faltante:
            horas_sugeridas = 0.0
            economia = custo_a
        else:
            fracao_corte = faltante / custo_a
            horas_sugeridas = round(a.daily_hours * (1 - fracao_corte), 2)
            economia = faltante

        items.append(PlanItem(
            appliance_id=a.id,
            appliance_name=a.name,
            current_daily_hours=a.daily_hours,
            suggested_daily_hours=horas_sugeridas,
            current_brl=round(custo_a, 2),
            projected_brl=round(custo_a - economia, 2),
            saving_brl=round(economia, 2),
        ))

        economia_acumulada += economia
        if economia_acumulada >= economia_necessaria:
            break

    status = "reached" if economia_max >= economia_necessaria else "not_reached"
    economia_efetiva = min(economia_acumulada, economia_max)

    return PlanResult(
        target_brl=meta_brl,
        current_brl=round(custo_atual, 2),
        projected_brl=round(custo_atual - economia_efetiva, 2),
        savings_brl=round(economia_efetiva, 2),
        status=status,
        items=items,
    )
