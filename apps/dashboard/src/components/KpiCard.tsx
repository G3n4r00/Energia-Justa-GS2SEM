import React from 'react'

interface Props {
  label: string
  value: string
  sub?: string
  alert?: boolean
  highlight?: boolean
}

export default function KpiCard({ label, value, sub, alert, highlight }: Props) {
  const valueColor = alert ? '#E53E3E' : highlight ? '#38A169' : '#1C2526'

  return (
    <div style={cardStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={{ ...valueStyle, color: valueColor }}>{value}</span>
      {sub && <span style={subStyle}>{sub}</span>}
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
  gap: 4,
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6B7880',
}

const valueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 1.2,
}

const subStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6B7880',
}
