import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { SeriesPoint } from '../api'

interface Props {
  points: SeriesPoint[]
  periodDays: number
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

export default function SeriesChart({ points }: Props) {
  const data = points.map((p) => ({ ...p, dateLabel: formatDate(p.date) }))

  return (
    <div style={cardStyle}>
      <span style={titleStyle}>Telemetria de sensores (simulada)</span>
      {data.length === 0 ? (
        <div style={emptyStyle}>
          Nenhuma leitura no período. Use a aba Simulador no app para gerar dados.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#6B7880' }} />
            <YAxis unit=" W" tick={{ fontSize: 11, fill: '#6B7880' }} width={56} />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} W`, 'Potência média']}
              labelFormatter={(label) => `Data: ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            />
            <Line
              type="monotone"
              dataKey="avg_power_w"
              stroke="#F5A623"
              strokeWidth={2}
              dot={{ r: 3, fill: '#F5A623' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 10,
  padding: '16px 20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const titleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6B7880',
}

const emptyStyle: React.CSSProperties = {
  height: 220,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6B7880',
  fontSize: 13,
  textAlign: 'center',
  padding: '0 24px',
}
