const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export interface AnalyticsSummary {
  total_kwh: number
  total_brl: number
  budget_brl: number
  tariff_rate_brl_kwh: number
  appliance_count: number
  savings_potential_brl: number
  category: string | null
}

export interface SeriesPoint {
  date: string
  avg_power_w: number
  readings_count: number
}

export interface AnalyticsSeries {
  period_days: number
  points: SeriesPoint[]
}

export interface ConsumptionItem {
  id: number
  name: string
  category: string
  kwh: number
  brl: number
  pct_of_total: number
}

export interface ConsumptionSummary {
  total_kwh: number
  total_brl: number
  budget_brl: number
  cycle_days: number
  tariff_rate_brl_kwh: number
  tariff_is_demo: boolean
  items: ConsumptionItem[]
}

export const api = {
  getAnalyticsSummary: (category?: string) =>
    get<AnalyticsSummary>(`/analytics/summary${category ? `?category=${encodeURIComponent(category)}` : ''}`),

  getAnalyticsSeries: (periodDays: number) =>
    get<AnalyticsSeries>(`/analytics/series?period_days=${periodDays}`),

  getConsumptionSummary: () =>
    get<ConsumptionSummary>('/consumption/summary'),
}
