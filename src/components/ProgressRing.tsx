import React from 'react'

interface Props {
  pct: number
  color: string
  size?: number
  stroke?: number
  label?: string
}

export default function ProgressRing({ pct, color, size = 80, stroke = 7, label }: Props) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#16213E" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-sm font-bold text-white">{pct}%</span>
        {label && <span className="text-[9px] text-[#B0BEC5]">{label}</span>}
      </div>
    </div>
  )
}
