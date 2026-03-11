import { create } from 'zustand'
import type { AppState, ConfigRow, DailyLogRow } from '../types'
import { fetchConfig, fetchDailyLog, writeDayLog } from '../api/sheets'
import { computeStreakForField } from '../utils/calculations'

interface ProgressStore extends AppState {
  setAuth: (token: string) => void
  setSheetId: (id: string) => void
  setStartDate: (date: string) => void
  syncData: () => Promise<void>
  saveDay: (updates: Partial<DailyLogRow>) => Promise<void>
  updateTodayField: <K extends keyof DailyLogRow>(key: K, value: DailyLogRow[K]) => void
  flashcardStreak: number
  gymStreak: number
}

function getCurrentDayInfo(log: DailyLogRow[], startDate: string): { dayNumber: number; weekNumber: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const found = log.find(r => r.date === todayStr)
  if (found) return { dayNumber: found.day_number, weekNumber: found.week_number }

  if (startDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const diffMs = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    const dayNumber = diffDays + 1
    const weekNumber = Math.ceil(dayNumber / 7)
    return { dayNumber: Math.max(1, Math.min(112, dayNumber)), weekNumber: Math.max(1, Math.min(16, weekNumber)) }
  }
  return { dayNumber: 1, weekNumber: 1 }
}

function dailyRowToArray(row: DailyLogRow): (string | number | boolean)[] {
  return [
    row.day_number,
    row.week_number,
    row.date,
    row.day_of_week,
    row.is_class_day,
    row.is_morning_class,
    row.book_chapter_completed,
    row.podcast_done,
    row.flashcard_done,
    row.class_attended,
    row.conversations_count,
    row.duolingo_test_score ?? '',
    row.walk_used_for_listening,
    row.app_hours,
    row.job_apps_sent,
    row.gym_done,
    row.life_event,
    row.energy_level ?? '',
    row.notes,
  ]
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  isAuthenticated: false,
  accessToken: null,
  sheetId: import.meta.env.VITE_SHEET_ID ?? '',
  startDate: '',
  configRows: [],
  dailyLog: [],
  todayRow: null,
  currentDayNumber: 1,
  currentWeekNumber: 1,
  loading: false,
  syncing: false,
  lastSynced: null,
  error: null,
  flashcardStreak: 0,
  gymStreak: 0,

  setAuth: (token) => set({ isAuthenticated: true, accessToken: token }),

  setSheetId: (id) => {
    set({ sheetId: id })
    localStorage.setItem('sheet_id', id)
  },

  setStartDate: (date) => set({ startDate: date }),

  syncData: async () => {
    const { accessToken, sheetId } = get()
    if (!accessToken || !sheetId) return
    set({ syncing: true, error: null })
    try {
      const [config, log] = await Promise.all([
        fetchConfig(accessToken, sheetId),
        fetchDailyLog(accessToken, sheetId),
      ])
      const { dayNumber, weekNumber } = getCurrentDayInfo(log, get().startDate)
      const today = new Date().toISOString().split('T')[0]
      const todayRow = log.find(r => r.date === today) ?? null
      const flashcardStreak = computeStreakForField(log.filter(r => r.date && new Date(r.date) <= new Date()), 'flashcard_done')
      const gymStreak = computeStreakForField(log.filter(r => r.date && new Date(r.date) <= new Date()), 'gym_done')
      set({
        configRows: config,
        dailyLog: log,
        todayRow,
        currentDayNumber: dayNumber,
        currentWeekNumber: weekNumber,
        lastSynced: new Date(),
        flashcardStreak,
        gymStreak,
        syncing: false,
      })
    } catch (e) {
      set({ error: (e as Error).message, syncing: false })
    }
  },

  updateTodayField: (key, value) => {
    const { todayRow } = get()
    if (!todayRow) return
    set({ todayRow: { ...todayRow, [key]: value } })
  },

  saveDay: async (updates) => {
    const { accessToken, sheetId, todayRow, dailyLog } = get()
    if (!accessToken || !sheetId || !todayRow) return
    const updated = { ...todayRow, ...updates }
    set({ todayRow: updated, syncing: true })
    try {
      await writeDayLog(accessToken, sheetId, updated.day_number, dailyRowToArray(updated))
      const newLog = dailyLog.map(r => r.day_number === updated.day_number ? updated : r)
      const flashcardStreak = computeStreakForField(newLog.filter(r => r.date && new Date(r.date) <= new Date()), 'flashcard_done')
      const gymStreak = computeStreakForField(newLog.filter(r => r.date && new Date(r.date) <= new Date()), 'gym_done')
      set({ dailyLog: newLog, flashcardStreak, gymStreak, syncing: false, lastSynced: new Date() })
    } catch (e) {
      set({ error: (e as Error).message, syncing: false })
    }
  },
}))
