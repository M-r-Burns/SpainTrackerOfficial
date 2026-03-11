import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  value: number
  unit?: string
}

export default function AheadBehindChip({ value, unit = '' }: Props) {
  const abs = Math.abs(value)
  const display = `${abs.toFixed(1)}${unit}`

  if (value > 0.1)
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-[#4CAF50]/20 text-[#4CAF50] px-2 py-0.5 rounded-full">
        <TrendingUp size={11} /> +{display} ahead
      </span>
    )
  if (value < -0.1)
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-[#F44336]/20 text-[#F44336] px-2 py-0.5 rounded-full">
        <TrendingDown size={11} /> -{display} behind
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-[#B0BEC5]/20 text-[#B0BEC5] px-2 py-0.5 rounded-full">
      <Minus size={11} /> on track
    </span>
  )
}
