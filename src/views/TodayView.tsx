import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, RefreshCw, Save } from 'lucide-react'
import { useProgressStore } from '../store/useProgressStore'
import StreakCounter from '../components/StreakCounter'
import type { DailyLogRow } from '../types'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
        checked ? 'bg-[#E94560]/10 border-[#E94560]/50 text-white' : 'bg-[#16213E]/70 border-[#16213E] text-[#B0BEC5]'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#E94560]' : 'bg-[#0D0D1A]/90'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </div>
    </button>
  )
}

function NumberInput({ value, onChange, label, unit, min = 0, step = 1 }: {
  value: number; onChange: (v: number) => void; label: string; unit?: string; min?: number; step?: number
}) {
  return (
    <div className="bg-[#16213E]/70 rounded-xl p-4 border border-[#16213E]">
      <div className="text-xs text-[#B0BEC5] mb-2">{label}</div>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-lg bg-[#1A1A2E] text-[#E94560] text-xl font-bold flex items-center justify-center">−</button>
        <span className="font-mono text-2xl font-bold text-white flex-1 text-center">{value}{unit && <span className="text-sm text-[#B0BEC5] ml-1">{unit}</span>}</span>
        <button onClick={() => onChange(value + step)}
          className="w-8 h-8 rounded-lg bg-[#1A1A2E] text-[#E94560] text-xl font-bold flex items-center justify-center">+</button>
      </div>
    </div>
  )
}

export default function TodayView() {
  const { todayRow, currentDayNumber, currentWeekNumber, configRows, isAuthenticated,
    updateTodayField, saveDay, syncData, syncing, lastSynced, flashcardStreak, gymStreak } = useProgressStore()
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const weekConfig = configRows.find(c => c.week_number === currentWeekNumber)
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const fallbackRow: DailyLogRow = {
    day_number: currentDayNumber,
    week_number: currentWeekNumber,
    date: today.toISOString().split('T')[0],
    day_of_week: today.toLocaleDateString('en-US', { weekday: 'long' }),
    is_class_day: [1, 2, 3, 4, 5].includes(today.getDay()),
    is_morning_class: [1, 3, 5].includes(today.getDay()),
    book_chapter_completed: false,
    podcast_done: 0,
    flashcard_done: false,
    class_attended: false,
    conversations_count: 0,
    duolingo_test_score: null,
    walk_used_for_listening: false,
    app_hours: 0,
    job_apps_sent: 0,
    gym_done: false,
    life_event: '',
    energy_level: null,
    notes: '',
  }

  const activeRow = todayRow ?? fallbackRow

  const classLabel = activeRow.is_morning_class ? '🌅 Morning Class' : activeRow.is_class_day ? '🌆 Afternoon Class' : '🏠 No Class Today'

  function updateField<K extends keyof DailyLogRow>(key: K, value: DailyLogRow[K]) {
    setDirty(true)
    updateTodayField(key, value)
  }

  async function handleSave() {
    await saveDay(activeRow)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 p-6">
        <div className="text-6xl">🇪🇸</div>
        <h1 className="text-2xl font-bold text-white text-center">Valencia Tracker</h1>
        <p className="text-[#B0BEC5] text-center text-sm max-w-xs">Track your 4-month immersive experience in Valencia, Spain.</p>
        <p className="text-[#B0BEC5] text-sm text-center">Connect your Google account in <strong className="text-white">Settings</strong> to get started.</p>
      </div>
    )
  }

  return (
    <motion.div className="p-4 relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 bg-[#E94560]/20 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-40 -left-10 h-36 w-36 bg-[#1565C0]/20 blur-3xl rounded-full" />

      <div className="mb-6 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-[#16213E] rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#B0BEC5]">{dateStr}</span>
          <button onClick={syncData} disabled={syncing} className="text-[#B0BEC5] hover:text-white transition-colors" aria-label="Sync data">
            <RefreshCw size={16} className={syncing ? 'animate-spin text-[#E94560]' : ''} />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Home Dashboard</h1>
        <p className="text-sm text-[#B0BEC5] mt-1">Day {currentDayNumber} of 112 — Week {currentWeekNumber}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {weekConfig && <span className="inline-block text-xs bg-[#E94560]/15 border border-[#E94560]/30 px-3 py-1 rounded-full text-[#E94560]">{weekConfig.phase}</span>}
          <span className="inline-block text-xs bg-[#16213E] px-3 py-1 rounded-full text-[#B0BEC5]">{classLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StreakCounter count={flashcardStreak} emoji="🃏" label="Flashcard Streak" />
        <StreakCounter count={gymStreak} emoji="💪" label="Gym Streak" />
      </div>

      <div className="bg-[#1A1A2E]/95 backdrop-blur border border-[#16213E] rounded-2xl p-4 space-y-3 mb-6 shadow-xl">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider">Daily Tasks</h2>
        <Toggle checked={activeRow.flashcard_done} onChange={v => updateField('flashcard_done', v)} label="🃏 Flashcards done" />
        {activeRow.is_class_day && (
          <Toggle checked={activeRow.class_attended} onChange={v => updateField('class_attended', v)} label="📚 Class attended" />
        )}
        <Toggle checked={activeRow.gym_done} onChange={v => updateField('gym_done', v)} label="💪 Gym done" />
        <Toggle checked={activeRow.book_chapter_completed} onChange={v => updateField('book_chapter_completed', v)} label="📖 Book chapter" />
        <Toggle checked={activeRow.walk_used_for_listening} onChange={v => updateField('walk_used_for_listening', v)} label="🎧 Walk for listening" />
      </div>

      <div className="bg-[#1A1A2E]/95 backdrop-blur border border-[#16213E] rounded-2xl p-4 space-y-3 mb-6 shadow-xl">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider">Track Numbers</h2>
        <NumberInput value={activeRow.app_hours} onChange={v => updateField('app_hours', v)} label="App Dev Hours" unit="h" step={0.5} />
        <NumberInput value={activeRow.job_apps_sent} onChange={v => updateField('job_apps_sent', v)} label="Job Applications Sent" />
        <NumberInput value={activeRow.conversations_count} onChange={v => updateField('conversations_count', v)} label="Spanish Conversations" />
        <NumberInput value={activeRow.podcast_done} onChange={v => updateField('podcast_done', v)} label="Podcast Hours" unit="h" step={0.5} />
      </div>

      <div className="bg-[#1A1A2E]/95 backdrop-blur border border-[#16213E] rounded-2xl p-4 mb-6 shadow-xl">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-3">Notes</h2>
        <input
          value={activeRow.life_event}
          onChange={e => updateField('life_event', e.target.value)}
          placeholder="Life event (optional)"
          className="w-full bg-[#16213E]/70 border border-[#16213E] rounded-xl px-3 py-2 text-white placeholder-[#B0BEC5]/50 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#E94560]/50"
        />
        <textarea
          value={activeRow.notes}
          onChange={e => updateField('notes', e.target.value)}
          placeholder="How was your day?"
          rows={3}
          className="w-full bg-[#16213E]/70 border border-[#16213E] rounded-xl p-4 text-white placeholder-[#B0BEC5]/50 text-sm resize-none outline-none focus:ring-2 focus:ring-[#E94560]/50"
        />
      </div>

      <div className="bg-[#1A1A2E]/95 backdrop-blur border border-[#16213E] rounded-2xl p-4 mb-6 shadow-xl">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-3">Energy & Score</h2>
        <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => updateField('energy_level', n)}
              className={`flex-1 h-10 rounded-xl text-sm font-mono font-bold transition-all ${activeRow.energy_level === n ? 'bg-[#E94560] text-white' : 'bg-[#16213E] text-[#B0BEC5]'}`}>
              {n}
            </button>
          ))}
        </div>
        <div className="text-xs text-[#B0BEC5] mb-1">Duolingo Test Score (optional)</div>
        <input
          type="number"
          min={0}
          max={160}
          value={activeRow.duolingo_test_score ?? ''}
          onChange={(e) => updateField('duolingo_test_score', e.target.value === '' ? null : Number(e.target.value))}
          placeholder="e.g. 110"
          className="w-full bg-[#16213E]/70 border border-[#16213E] rounded-xl px-3 py-2 text-white placeholder-[#B0BEC5]/50 text-sm outline-none focus:ring-2 focus:ring-[#E94560]/50"
        />
      </div>

      <motion.button
        onClick={handleSave}
        disabled={syncing}
        className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${saved ? 'bg-[#4CAF50]' : 'bg-[#E94560]'}`}
        whileTap={{ scale: 0.97 }}
      >
        {syncing ? <RefreshCw size={18} className="animate-spin" /> : saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
        {saved ? 'Saved! ✓' : syncing ? 'Saving…' : 'Save Day'}
      </motion.button>

      <p className="text-center text-xs text-[#B0BEC5] mt-3">
        {dirty ? 'Unsaved changes' : 'All changes saved locally'}
        {lastSynced && ` • Last synced ${lastSynced.toLocaleTimeString()}`}
      </p>

      {weekConfig?.week_focus && (
        <div className="mt-6 p-4 bg-[#1A1A2E] rounded-2xl border border-[#E94560]/20">
          <p className="text-xs text-[#E94560] font-semibold mb-1">WEEK FOCUS</p>
          <p className="text-sm text-[#B0BEC5]">{weekConfig.week_focus}</p>
        </div>
      )}
    </motion.div>
  )
}
