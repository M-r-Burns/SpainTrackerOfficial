import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Save } from 'lucide-react'
import { useProgressStore } from '../store/useProgressStore'
import StreakCounter from '../components/StreakCounter'
import type { DailyLogRow } from '../types'
import { formatIsoDateForDisplay, getWeekdayIndexFromIso, getWeekdayNameFromIso } from '../utils/madridTime'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
        checked ? 'bg-[#4FC3F7]/12 border-[#4FC3F7]/50 text-white' : 'bg-[#16213E]/70 border-[#16213E] text-[#B0BEC5]'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#4FC3F7]' : 'bg-[#0D0D1A]/90'}`}>
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
          className="w-8 h-8 rounded-lg bg-[#1A1A2E] text-[#4FC3F7] text-xl font-bold flex items-center justify-center">−</button>
        <span className="font-mono text-2xl font-bold text-white flex-1 text-center">{value}{unit && <span className="text-sm text-[#B0BEC5] ml-1">{unit}</span>}</span>
        <button onClick={() => onChange(value + step)}
          className="w-8 h-8 rounded-lg bg-[#1A1A2E] text-[#4FC3F7] text-xl font-bold flex items-center justify-center">+</button>
      </div>
      <div className="mt-3">
        <input
          type="number"
          min={min}
          step={step < 1 ? 0.1 : 1}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (!Number.isFinite(next)) return
            onChange(Math.max(min, next))
          }}
          className="w-full bg-[#1A1A2E] border border-[#0D0D1A] rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#4FC3F7]/50"
        />
      </div>
    </div>
  )
}

function PodcastMinutesInput({ minutes, onChangeMinutes }: { minutes: number; onChangeMinutes: (v: number) => void }) {
  return (
    <div className="bg-[#16213E]/70 rounded-xl p-4 border border-[#16213E]">
      <div className="text-xs text-[#B0BEC5] mb-2">Podcast Listening</div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChangeMinutes(Math.max(0, minutes - 10))}
          className="w-8 h-8 rounded-lg bg-[#1A1A2E] text-[#4FC3F7] text-xl font-bold flex items-center justify-center"
        >
          −
        </button>
        <span className="font-mono text-2xl font-bold text-white flex-1 text-center">
          {minutes}
          <span className="text-sm text-[#B0BEC5] ml-1">min</span>
        </span>
        <button
          onClick={() => onChangeMinutes(minutes + 10)}
          className="w-8 h-8 rounded-lg bg-[#1A1A2E] text-[#4FC3F7] text-xl font-bold flex items-center justify-center"
        >
          +
        </button>
      </div>
      <div className="mt-3">
        <input
          type="number"
          min={0}
          step={10}
          inputMode="numeric"
          value={minutes}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (!Number.isFinite(next)) return
            onChangeMinutes(Math.max(0, Math.round(next)))
          }}
          className="w-full bg-[#1A1A2E] border border-[#0D0D1A] rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#4FC3F7]/50"
        />
        <p className="text-[11px] text-[#B0BEC5] mt-1">Quick buttons change by 10 minutes.</p>
      </div>
    </div>
  )
}

export default function TodayView() {
  const {
    selectedRow,
    selectedDayNumber,
    selectedWeekNumber,
    currentDayNumber,
    currentWeekNumber,
    configRows,
    isAuthenticated,
    updateTodayField,
    saveDay,
    syncData,
    syncing,
    lastSynced,
    flashcardStreak,
    gymStreak,
    goToRelativeDay,
    goToToday,
    refreshCurrentDayFromDeviceTime,
    madridDateIso,
  } = useProgressStore()
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const weekConfig = configRows.find(c => c.week_number === selectedWeekNumber)
  const isViewingToday = selectedDayNumber === currentDayNumber

  const fallbackRow: DailyLogRow = {
    day_number: selectedDayNumber,
    week_number: selectedWeekNumber,
    date: madridDateIso,
    day_of_week: getWeekdayNameFromIso(madridDateIso, 'en-US'),
    is_class_day: [1, 2, 3, 4, 5].includes(getWeekdayIndexFromIso(madridDateIso)),
    is_morning_class: [1, 3, 5].includes(getWeekdayIndexFromIso(madridDateIso)),
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

  const activeRow = selectedRow ?? fallbackRow
  const dateStr = formatIsoDateForDisplay(activeRow.date, 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const podcastMinutes = Math.round(activeRow.podcast_done * 60)

  const classLabel = activeRow.is_morning_class ? '🌅 Morning Class' : activeRow.is_class_day ? '🌆 Afternoon Class' : '🏠 No Class Today'

  function updateField<K extends keyof DailyLogRow>(key: K, value: DailyLogRow[K]) {
    setDirty(true)
    updateTodayField(key, value)
  }

  useEffect(() => {
    setDirty(false)
    setSaved(false)
  }, [selectedDayNumber])

  useEffect(() => {
    const changedOnMount = refreshCurrentDayFromDeviceTime()
    if (changedOnMount) {
      void syncData()
    }
    const timer = window.setInterval(() => {
      const changed = refreshCurrentDayFromDeviceTime()
      if (changed) {
        void syncData()
      }
    }, 10000)
    return () => window.clearInterval(timer)
  }, [refreshCurrentDayFromDeviceTime, syncData])

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
      <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 bg-[#4FC3F7]/20 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-40 -left-10 h-36 w-36 bg-[#E0E0E0]/12 blur-3xl rounded-full" />

      <div className="mb-6 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-[#16213E] rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#B0BEC5]">{dateStr}</span>
          <button onClick={syncData} disabled={syncing} className="text-[#B0BEC5] hover:text-white transition-colors" aria-label="Sync data">
            <RefreshCw size={16} className={syncing ? 'animate-spin text-[#E94560]' : ''} />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Home Dashboard</h1>
        <p className="text-sm text-[#B0BEC5] mt-1">Day {selectedDayNumber} of 112 — Week {selectedWeekNumber}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => goToRelativeDay(-1)}
            disabled={selectedDayNumber <= 1}
            className="h-9 w-9 rounded-lg bg-[#16213E] text-white disabled:opacity-40 flex items-center justify-center"
            aria-label="Go to previous day"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToToday}
            disabled={isViewingToday}
            className="h-9 px-3 rounded-lg bg-[#16213E] text-xs text-white disabled:opacity-40"
          >
            Today
          </button>
          <button
            onClick={() => goToRelativeDay(1)}
            disabled={selectedDayNumber >= 112}
            className="h-9 w-9 rounded-lg bg-[#16213E] text-white disabled:opacity-40 flex items-center justify-center"
            aria-label="Go to next day"
          >
            <ChevronRight size={16} />
          </button>
          {!isViewingToday && <span className="text-xs text-[#4FC3F7]">Viewing another day</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {weekConfig && <span className="inline-block text-xs bg-[#4FC3F7]/15 border border-[#4FC3F7]/35 px-3 py-1 rounded-full text-[#4FC3F7]">{weekConfig.phase}</span>}
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
        <PodcastMinutesInput
          minutes={podcastMinutes}
          onChangeMinutes={(minutes) => updateField('podcast_done', Number((minutes / 60).toFixed(2)))}
        />
      </div>

      <div className="bg-[#1A1A2E]/95 backdrop-blur border border-[#16213E] rounded-2xl p-4 mb-6 shadow-xl">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-3">Notes</h2>
        <input
          value={activeRow.life_event}
          onChange={e => updateField('life_event', e.target.value)}
          placeholder="Life event (optional)"
          className="w-full bg-[#16213E]/70 border border-[#16213E] rounded-xl px-3 py-2 text-white placeholder-[#B0BEC5]/50 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#4FC3F7]/50"
        />
        <textarea
          value={activeRow.notes}
          onChange={e => updateField('notes', e.target.value)}
          placeholder="How was your day?"
          rows={3}
          className="w-full bg-[#16213E]/70 border border-[#16213E] rounded-xl p-4 text-white placeholder-[#B0BEC5]/50 text-sm resize-none outline-none focus:ring-2 focus:ring-[#4FC3F7]/50"
        />
      </div>

      <div className="bg-[#1A1A2E]/95 backdrop-blur border border-[#16213E] rounded-2xl p-4 mb-6 shadow-xl">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-3">Energy & Score</h2>
        <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => updateField('energy_level', n)}
              className={`flex-1 h-10 rounded-xl text-sm font-mono font-bold transition-all ${activeRow.energy_level === n ? 'bg-[#4FC3F7] text-[#0F2027]' : 'bg-[#16213E] text-[#B0BEC5]'}`}>
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
          className="w-full bg-[#16213E]/70 border border-[#16213E] rounded-xl px-3 py-2 text-white placeholder-[#B0BEC5]/50 text-sm outline-none focus:ring-2 focus:ring-[#4FC3F7]/50"
        />
      </div>

      <motion.button
        onClick={handleSave}
        disabled={syncing}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${saved ? 'bg-[#4CAF50] text-white' : 'bg-[#4FC3F7] text-[#0F2027]'}`}
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
        <div className="mt-6 p-4 bg-[#1A1A2E] rounded-2xl border border-[#4FC3F7]/20">
          <p className="text-xs text-[#4FC3F7] font-semibold mb-1">WEEK FOCUS</p>
          <p className="text-sm text-[#B0BEC5]">{weekConfig.week_focus}</p>
        </div>
      )}
    </motion.div>
  )
}
