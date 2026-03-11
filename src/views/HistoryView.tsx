import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useProgressStore } from '../store/useProgressStore'
import HeatmapCalendar from '../components/HeatmapCalendar'

type HeatField = 'flashcard_done' | 'gym_done' | 'class_attended'

const FIELDS: { key: HeatField; label: string }[] = [
  { key: 'flashcard_done', label: '🃏 Flashcards' },
  { key: 'gym_done', label: '💪 Gym' },
  { key: 'class_attended', label: '📚 Class' },
]

export default function HistoryView() {
  const { dailyLog, isAuthenticated } = useProgressStore()
  const [field, setField] = useState<HeatField>('flashcard_done')

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-[80vh] text-[#B0BEC5]">Connect Google account in Settings</div>
  )

  const today = new Date()
  const past = [...dailyLog]
    .filter(r => r.date && new Date(r.date) <= today)
    .sort((a, b) => b.day_number - a.day_number)

  return (
    <motion.div className="p-4 max-w-lg mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-white mb-4">History</h1>

      <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-6">
        <div className="flex gap-2 mb-4">
          {FIELDS.map(f => (
            <button key={f.key} onClick={() => setField(f.key)}
              className={`flex-1 text-xs py-2 rounded-xl transition-all ${field === f.key ? 'bg-[#E94560] text-white' : 'bg-[#16213E] text-[#B0BEC5]'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <HeatmapCalendar log={dailyLog} field={field} />
      </div>

      <div className="space-y-3">
        {past.slice(0, 30).map(day => (
          <div key={day.day_number} className="bg-[#1A1A2E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-white text-sm">Day {day.day_number}</span>
                <span className="text-[#B0BEC5] text-xs ml-2">{new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
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
