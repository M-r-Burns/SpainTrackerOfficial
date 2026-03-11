import React from 'react'
import { motion } from 'framer-motion'
import { useProgressStore } from '../store/useProgressStore'
import HeatmapCalendar from '../components/HeatmapCalendar'
import { formatIsoDateForDisplay, isOnOrBeforeMadridToday } from '../utils/madridTime'

export default function HistoryView() {
  const { dailyLog, isAuthenticated } = useProgressStore()

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-[80vh] text-[#B0BEC5]">Connect Google account in Settings</div>
  )

  const past = [...dailyLog]
    .filter(r => r.date && isOnOrBeforeMadridToday(r.date))
    .sort((a, b) => b.day_number - a.day_number)

  return (
    <motion.div className="p-4 max-w-lg mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-white mb-4">History</h1>

      <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-3">Daily Intensity</h2>
        <HeatmapCalendar log={dailyLog} />
      </div>

      <div className="space-y-3">
        {past.slice(0, 30).map(day => (
          <div key={day.day_number} className="bg-[#1A1A2E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-white text-sm">Day {day.day_number}</span>
                <span className="text-[#B0BEC5] text-xs ml-2">{formatIsoDateForDisplay(day.date, 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="flex gap-1">
                {day.flashcard_done && <span title="Flashcards">🃏</span>}
                {day.gym_done && <span title="Gym">💪</span>}
                {day.class_attended && <span title="Class">📚</span>}
                {day.book_chapter_completed && <span title="Book">📖</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[#B0BEC5]">
              {day.app_hours > 0 && <span className="bg-[#16213E] px-2 py-0.5 rounded-full">{day.app_hours}h app</span>}
              {day.job_apps_sent > 0 && <span className="bg-[#16213E] px-2 py-0.5 rounded-full">{day.job_apps_sent} jobs</span>}
              {day.conversations_count > 0 && <span className="bg-[#16213E] px-2 py-0.5 rounded-full">{day.conversations_count} convos</span>}
              {day.energy_level && <span className="bg-[#16213E] px-2 py-0.5 rounded-full">⚡{day.energy_level}/5</span>}
            </div>
            {day.notes && <p className="text-xs text-[#B0BEC5] mt-2 italic">"{day.notes}"</p>}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
