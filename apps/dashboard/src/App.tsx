import React, { useEffect, useState } from 'react'
import { api } from './api'
import type { AnalyticsSummary, AnalyticsSeries, ConsumptionSummary } from './api'
import KpiCard from './components/KpiCard'
import SeriesChart from './components/SeriesChart'
import ApplianceChart from './components/ApplianceChart'

const CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'cooling', label: 'Refrigeração' },
  { value: 'heating', label: 'Aquecimento' },
  { value: 'entertainment', label: 'Entretenimento' },
  { value: 'appliance', label: 'Eletrodomésticos' },
  { value: 'cooking', label: 'Cozinha' },
  { value: 'electronics', label: 'Eletrônicos' },
]

const PERIODS = [7, 14, 30]

function brl(value: number): string {
  return 'R$ ' + value.toFixed(2).replace('.', ',')
}

export default function App() {
  const [category, setCategory] = useState('')
  const [periodDays, setPeriodDays] = useState(30)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [series, setSeries] = useState<AnalyticsSeries | null>(null)
  const [consumption, setConsumption] = useState<ConsumptionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.getAnalyticsSummary(category || undefined),
      api.getAnalyticsSeries(periodDays),
      api.getConsumptionSummary(),
    ])
      .then(([s, sr, c]) => {
        setSummary(s)
        setSeries(sr)
        setConsumption(c)
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [category, periodDays])

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={headerStyle}>
        <span style={logoStyle}>⚡ EnergiaJusta</span>
        <span style={subtitleStyle}>Dashboard analítico</span>
      </header>

      <main style={mainStyle}>
        <div style={filtersStyle}>
          <label style={filterLabelStyle}>Categoria:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={selectStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <span style={{ ...filterLabelStyle, marginLeft: 16 }}>Período (sensores):</span>
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodDays(p)}
              style={{
                ...periodBtnStyle,
                background: periodDays === p ? '#F5A623' : '#E8EDF0',
                color: periodDays === p ? '#1C2526' : '#4A5568',
                fontWeight: periodDays === p ? 700 : 400,
              }}
            >
              {p}d
            </button>
          ))}
        </div>

        {error && (
          <div style={errorStyle}>
            Erro ao carregar dados: {error}. Verifique se o backend está em execução.
          </div>
        )}

        {loading ? (
          <div style={loadingStyle}>Carregando...</div>
        ) : summary && (
          <>
            <div style={kpiGridStyle}>
              <KpiCard
                label="Consumo estimado"
                value={brl(summary.total_brl)}
                sub={`${summary.total_kwh.toFixed(1)} kWh no ciclo`}
                alert={summary.total_brl > summary.budget_brl}
              />
              <KpiCard
                label="Meta de orçamento"
                value={brl(summary.budget_brl)}
                sub={`Ciclo de ${consumption?.cycle_days ?? 30} dias`}
              />
              <KpiCard
                label="Economia potencial"
                value={brl(summary.savings_potential_brl)}
                sub="Último plano gerado"
                highlight
              />
              <KpiCard
                label="Tarifa ativa"
                value={`R$ ${summary.tariff_rate_brl_kwh.toFixed(5)}`}
                sub="por kWh — Enel SP B1"
              />
            </div>

            <div style={chartsGridStyle}>
              <SeriesChart points={series?.points ?? []} periodDays={periodDays} />
              <ApplianceChart items={consumption?.items ?? []} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  background: '#1C2526',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const logoStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#F5A623',
}

const subtitleStyle: React.CSSProperties = {
  color: '#8A9BA8',
  fontSize: 13,
}

const mainStyle: React.CSSProperties = {
  padding: '24px',
  maxWidth: 1200,
  margin: '0 auto',
}

const filtersStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 24,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const filterLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 13,
  color: '#1C2526',
}

const selectStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #D1D9E0',
  background: 'white',
  fontSize: 13,
  cursor: 'pointer',
  color: '#1C2526',
}

const periodBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  fontSize: 13,
  cursor: 'pointer',
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16,
  marginBottom: 20,
}

const chartsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}

const errorStyle: React.CSSProperties = {
  color: '#E53E3E',
  padding: '12px 16px',
  background: '#FFF5F5',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: 13,
}

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 48,
  color: '#6B7880',
  fontSize: 14,
}
