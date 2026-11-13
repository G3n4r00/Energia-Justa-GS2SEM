import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ConsumptionItem } from '../api'

interface Props {
  items: ConsumptionItem[]
}

export default function ApplianceChart({ items }: Props) {
  const top6 = [...items]
    .sort((a, b) => b.brl - a.brl)
    .slice(0, 6)
    .map((item) => ({
      name: item.name.length > 18 ? item.name.slice(0, 17) + '…' : item.name,
      brl: item.brl,
    }))

  return (
    <div style={cardStyle}>
      <span style={titleStyle}>Consumo por aparelho (R$)</span>
      {top6.length === 0 ? (
        <div style={emptyStyle}>Nenhum aparelho cadastrado.</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            layout="vertical"
            data={top6}
            margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6B7880' }}
              tickFormatter={(v: number) => `R$${v.toFixed(0)}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11, fill: '#1C2526' }}
            />
            <Tooltip
              formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Custo']}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            />
            <Bar dataKey="brl" fill="#F5A623" radius={[0, 4, 4, 0]} />
          </BarChart>
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
}
