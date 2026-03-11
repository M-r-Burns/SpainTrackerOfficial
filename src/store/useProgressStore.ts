import { create } from 'zustand'
import type { AppState, ConfigRow, DailyLogRow } from '../types'
import { fetchConfig, fetchDailyLog, getStartDate, writeDayLog } from '../api/sheets'
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

function isValidIsoDate(value: string): boolean {
  if (!value) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime())
}

function getCurrentDayInfo(log: DailyLogRow[], startDate: string): { dayNumber: number; weekNumber: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const found = log.find(r => r.date === todayStr)
  if (found) return { dayNumber: found.day_number, weekNumber: found.week_number }

  if (isValidIsoDate(startDate)) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const diffMs = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    const dayNumber = diffDays + 1
    const weekNumber = Math.ceil(dayNumber / 7)
    const safeDay = Number.isFinite(dayNumber) ? dayNumber : 1
    const safeWeek = Number.isFinite(weekNumber) ? weekNumber : 1
    return { dayNumber: Math.max(1, Math.min(112, safeDay)), weekNumber: Math.max(1, Math.min(16, safeWeek)) }
  }
  return { dayNumber: 1, weekNumber: 1 }
}

function getTodayIsoDate(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString().split('T')[0]
}

function getIsoDateFromStartDate(startDate: string, dayNumber: number): string {
  if (!isValidIsoDate(startDate) || !Number.isFinite(dayNumber)) return getTodayIsoDate()
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + (dayNumber - 1))
  if (Number.isNaN(start.getTime())) return getTodayIsoDate()
  return start.toISOString().split('T')[0]
}

function getDayOfWeek(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('en-US', { weekday: 'long' })
}

function createDefaultDailyRow(dayNumber: number, weekNumber: number, startDate: string): DailyLogRow {
  const safeDay = Number.isFinite(dayNumber) ? Math.max(1, Math.min(112, Math.round(dayNumber))) : 1
  const safeWeek = Number.isFinite(weekNumber) ? Math.max(1, Math.min(16, Math.round(weekNumber))) : 1
  const date = getIsoDateFromStartDate(startDate, safeDay)
  const weekday = getDayOfWeek(date)
  const weekdayIndex = new Date(date).getDay()
  const isClassDay = weekdayIndex >= 1 && weekdayIndex <= 5
  const isMorningClass = weekdayIndex === 1 || weekdayIndex === 3 || weekdayIndex === 5

  return {
    day_number: safeDay,
    week_number: safeWeek,
    date,
    day_of_week: weekday,
    is_class_day: isClassDay,
    is_morning_class: isMorningClass,
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
}

function resolveTodayRow(log: DailyLogRow[], dayNumber: number, weekNumber: number, startDate: string): DailyLogRow {
  const today = getTodayIsoDate()
  return (
    log.find(r => r.date === today) ??
    log.find(r => r.day_number === dayNumber) ??
    createDefaultDailyRow(dayNumber, weekNumber, startDate)
  )
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
  // prefer the build-time environment variable; fall back to whatever the user previously entered
  sheetId: import.meta.env.VITE_SHEET_ID || localStorage.getItem('sheet_id') || '',
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
    // if a sheet ID was baked into the build via env, ignore attempts to change it
    if (import.meta.env.VITE_SHEET_ID) {
      console.warn('Sheet ID is supplied via environment and cannot be changed at runtime.')
      return
    }
    set({ sheetId: id })
    localStorage.setItem('sheet_id', id)
  },

  setStartDate: (date) => set({ startDate: date }),

  syncData: async () => {
    const { accessToken, sheetId } = get()
    if (!accessToken || !sheetId) return
    set({ syncing: true, error: null })
    try {
      const [config, log, fetchedStartDate] = await Promise.all([
        fetchConfig(accessToken, sheetId),
        fetchDailyLog(accessToken, sheetId),
        getStartDate(accessToken, sheetId),
      ])
      const activeStartDate = isValidIsoDate(fetchedStartDate) ? fetchedStartDate : get().startDate
      const { dayNumber, weekNumber } = getCurrentDayInfo(log, activeStartDate)
      const todayRow = resolveTodayRow(log, dayNumber, weekNumber, activeStartDate)
      const flashcardStreak = computeStreakForField(log.filter(r => r.date && new Date(r.date) <= new Date()), 'flashcard_done')
      const gymStreak = computeStreakForField(log.filter(r => r.date && new Date(r.date) <= new Date()), 'gym_done')
      set({
        startDate: activeStartDate,
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
      const { dailyLog, currentDayNumber, currentWeekNumber, startDate } = get()
      set({
        error: (e as Error).message,
        syncing: false,
        todayRow: resolveTodayRow(dailyLog, currentDayNumber, currentWeekNumber, startDate),
      })
    }
  },

  updateTodayField: (key, value) => {
    const { todayRow, currentDayNumber, currentWeekNumber, startDate } = get()
    const baseRow = todayRow ?? createDefaultDailyRow(currentDayNumber, currentWeekNumber, startDate)
    set({ todayRow: { ...baseRow, [key]: value } })
  },

  saveDay: async (updates) => {
    const { accessToken, sheetId, todayRow, dailyLog, currentDayNumber, currentWeekNumber, startDate } = get()
    if (!accessToken || !sheetId) return
    const baseRow = todayRow ?? createDefaultDailyRow(currentDayNumber, currentWeekNumber, startDate)
    const updated = { ...baseRow, ...updates }
    set({ todayRow: updated, syncing: true })
    try {
      await writeDayLog(accessToken, sheetId, updated.day_number, dailyRowToArray(updated))
      const hasExistingDay = dailyLog.some(r => r.day_number === updated.day_number)
      const newLog = hasExistingDay
        ? dailyLog.map(r => r.day_number === updated.day_number ? updated : r)
        : [...dailyLog, updated].sort((a, b) => a.day_number - b.day_number)
      const flashcardStreak = computeStreakForField(newLog.filter(r => r.date && new Date(r.date) <= new Date()), 'flashcard_done')
      const gymStreak = computeStreakForField(newLog.filter(r => r.date && new Date(r.date) <= new Date()), 'gym_done')
      set({ dailyLog: newLog, flashcardStreak, gymStreak, syncing: false, lastSynced: new Date() })
    } catch (e) {
      set({ error: (e as Error).message, syncing: false })
    }
  },
}))
