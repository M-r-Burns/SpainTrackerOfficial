import React from 'react'
import { motion } from 'framer-motion'
import { useProgressStore } from '../store/useProgressStore'
import { getOverallCategoryProgress } from '../utils/calculations'
import ProgressRing from '../components/ProgressRing'
import AheadBehindChip from '../components/AheadBehindChip'

const PHASES = [
  { weeks: [1,4], label: 'Foundation', color: '#1565C0' },
  { weeks: [5,8], label: 'Building', color: '#2E7D32' },
  { weeks: [9,12], label: 'Momentum', color: '#E65100' },
  { weeks: [13,16], label: 'Peak', color: '#E94560' },
]

export default function OverallView() {
  const { configRows, dailyLog, currentWeekNumber, isAuthenticated } = useProgressStore()

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-[80vh] text-[#B0BEC5]">Connect Google account in Settings</div>
  )

  const today = new Date()
  const loggedDays = dailyLog.filter(r => r.date && new Date(r.date) <= today)
  const currentDayInWeek = loggedDays.filter(r => r.week_number === currentWeekNumber).length

  const categories = getOverallCategoryProgress(configRows, dailyLog, currentWeekNumber, currentDayInWeek)

  const totalAppHours = loggedDays.reduce((s, r) => s + r.app_hours, 0)
  const totalJobApps = loggedDays.reduce((s, r) => s + r.job_apps_sent, 0)
  const totalConversations = loggedDays.reduce((s, r) => s + r.conversations_count, 0)
  const overallPct = Math.round(((currentWeekNumber - 1) * 7 + currentDayInWeek) / 112 * 100)

  return (
    <motion.div className="p-4 max-w-lg mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Overall Progress</h1>
        <p className="text-[#B0BEC5] text-sm">Week {currentWeekNumber} of 16 — {overallPct}% through the journey</p>
      </div>

      <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-6">
        <div className="flex justify-between text-xs text-[#B0BEC5] mb-2">
          <span>Week 1</span>
          <span>Week {currentWeekNumber} ▼</span>
          <span>Week 16</span>
        </div>
        <div className="w-full bg-[#16213E] rounded-full h-3 relative overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#1565C0] via-[#E65100] to-[#E94560] rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%` }} />
        </div>
        <div className="flex mt-2 gap-1">
          {PHASES.map(ph => (
            <div key={ph.label} className="flex-1">
              <div className="h-1 rounded" style={{ backgroundColor: ph.color }} />
              <span className="text-[9px] text-[#B0BEC5]">{ph.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        {categories.map(cat => (
          <div key={cat.name} className="bg-[#1A1A2E] rounded-2xl p-4 flex items-center gap-4">
            <ProgressRing pct={cat.pct} color={cat.color} size={72} stroke={7} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{cat.name}</span>
                <AheadBehindChip value={cat.aheadBehind} />
              </div>
              <div className="mt-1">
                <span className="font-mono text-lg font-bold text-white">
                  {typeof cat.actual === 'number' && cat.actual % 1 !== 0 ? cat.actual.toFixed(1) : cat.actual}
                </span>
                <span className="text-[#B0BEC5] text-sm"> / {cat.target}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'App Hours', value: totalAppHours.toFixed(1), color: '#2E7D32' },
          { label: 'Job Apps', value: totalJobApps, color: '#E65100' },
          { label: 'Convos', value: totalConversations, color: '#1565C0' },
        ].map(s => (
          <div key={s.label} className="bg-[#1A1A2E] rounded-2xl p-3 text-center">
            <div className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[#B0BEC5] mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
