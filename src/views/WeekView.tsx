import React from 'react'
import { motion } from 'framer-motion'
import { useProgressStore } from '../store/useProgressStore'
import { getWeekCategoryProgress } from '../utils/calculations'
import AheadBehindChip from '../components/AheadBehindChip'

export default function WeekView() {
  const { configRows, dailyLog, currentWeekNumber, isAuthenticated } = useProgressStore()

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-[80vh] text-[#B0BEC5]">Connect Google account in Settings</div>
  )

  const weekConfig = configRows.find(c => c.week_number === currentWeekNumber)
  const categories = getWeekCategoryProgress(configRows, dailyLog, currentWeekNumber)
  const weekLog = dailyLog.filter(r => r.week_number === currentWeekNumber)
  const today = new Date()
  const daysElapsed = weekLog.filter(r => r.date && new Date(r.date) <= today).length
  const daysRemaining = 7 - daysElapsed

  const dates = weekLog.map(r => r.date).filter(Boolean).sort()
  const dateRange = dates.length >= 2 ? `${new Date(dates[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(dates[dates.length-1]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''

  return (
    <motion.div className="p-4 max-w-lg mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Week {currentWeekNumber} of 16</h1>
        <p className="text-[#E94560] text-sm font-medium">{weekConfig?.phase}</p>
        {dateRange && <p className="text-xs text-[#B0BEC5] mt-1">{dateRange}</p>}
        <p className="text-xs text-[#B0BEC5]">{daysRemaining} days remaining this week</p>
      </div>

      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat.name} className="bg-[#1A1A2E] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-white">{cat.name}</span>
                <div className="mt-1"><AheadBehindChip value={cat.aheadBehind} /></div>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-bold text-white">{typeof cat.actual === 'number' && cat.actual % 1 !== 0 ? cat.actual.toFixed(1) : cat.actual}</span>
                <span className="text-[#B0BEC5] text-sm"> / {cat.target}</span>
              </div>
            </div>
            <div className="w-full bg-[#16213E] rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-[#B0BEC5]">{cat.pct}% complete</span>
            </div>
          </div>
        ))}
      </div>

      {weekConfig?.week_focus && (
        <div className="mt-6 p-4 bg-[#1A1A2E] rounded-2xl border border-[#E94560]/20">
          <p className="text-xs text-[#E94560] font-semibold mb-1">WEEK FOCUS</p>
          <p className="text-sm text-[#B0BEC5]">{weekConfig.week_focus}</p>
        </div>
      )}
    </motion.div>
  )
}
