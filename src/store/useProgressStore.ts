import { create } from 'zustand'
import type { AppState, ConfigRow, DailyLogRow } from '../types'
import { fetchConfig, fetchDailyLog, getStartDate, writeDayLog } from '../api/sheets'
import { computeStreakForField } from '../utils/calculations'
import {
  addDaysToIsoDate,
  getIsoDayDifference,
  getMadridTodayIso,
  getWeekdayIndexFromIso,
  getWeekdayNameFromIso,
  isIsoOnOrBefore,
} from '../utils/madridTime'

interface ProgressStore extends AppState {
  setAuth: (token: string) => void
  setSheetId: (id: string) => void
  setStartDate: (date: string) => void
  syncData: () => Promise<void>
  saveDay: (updates: Partial<DailyLogRow>) => Promise<void>
  updateTodayField: <K extends keyof DailyLogRow>(key: K, value: DailyLogRow[K]) => void
  goToRelativeDay: (delta: number) => void
  goToToday: () => void
  refreshCurrentDayFromDeviceTime: () => boolean
  flashcardStreak: number
  gymStreak: number
}

function isValidIsoDate(value: string): boolean {
  if (!value) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime())
}

function clampDayNumber(dayNumber: number): number {
  return Math.max(1, Math.min(112, dayNumber))
}

function getCurrentDayInfo(log: DailyLogRow[], startDate: string, madridTodayIso: string): { dayNumber: number; weekNumber: number } {
  const todayStr = madridTodayIso

  const found = log.find(r => r.date === todayStr)
  if (found) return { dayNumber: found.day_number, weekNumber: found.week_number }

  if (isValidIsoDate(startDate)) {
    const diffDays = getIsoDayDifference(startDate, madridTodayIso)
    const dayNumber = diffDays + 1
    const weekNumber = Math.ceil(dayNumber / 7)
    const safeDay = Number.isFinite(dayNumber) ? dayNumber : 1
    const safeWeek = Number.isFinite(weekNumber) ? weekNumber : 1
    return { dayNumber: clampDayNumber(safeDay), weekNumber: Math.max(1, Math.min(16, safeWeek)) }
  }
  return { dayNumber: 1, weekNumber: 1 }
}

function getIsoDateFromStartDate(startDate: string, dayNumber: number): string {
  if (!isValidIsoDate(startDate) || !Number.isFinite(dayNumber)) return getMadridTodayIso()
  return addDaysToIsoDate(startDate, dayNumber - 1)
}

function getDayOfWeek(dateIso: string): string {
  return getWeekdayNameFromIso(dateIso, 'en-US')
}

function createDefaultDailyRow(dayNumber: number, weekNumber: number, startDate: string): DailyLogRow {
  const safeDay = Number.isFinite(dayNumber) ? Math.max(1, Math.min(112, Math.round(dayNumber))) : 1
  const safeWeek = Number.isFinite(weekNumber) ? Math.max(1, Math.min(16, Math.round(weekNumber))) : 1
  const date = getIsoDateFromStartDate(startDate, safeDay)
  const weekday = getDayOfWeek(date)
  const weekdayIndex = getWeekdayIndexFromIso(date)
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

function resolveDayRow(log: DailyLogRow[], dayNumber: number, weekNumber: number, startDate: string, fallbackTodayIso: string): DailyLogRow {
  const safeDay = clampDayNumber(dayNumber)
  const safeWeek = Math.max(1, Math.min(16, weekNumber))
  return (
    log.find(r => r.day_number === safeDay) ??
    createDefaultDailyRow(safeDay, safeWeek, isValidIsoDate(startDate) ? startDate : fallbackTodayIso)
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
  selectedRow: null,
  currentDayNumber: 1,
  currentWeekNumber: 1,
  selectedDayNumber: 1,
  selectedWeekNumber: 1,
  madridDateIso: getMadridTodayIso(),
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
      const madridTodayIso = getMadridTodayIso()
      const [config, log, fetchedStartDate] = await Promise.all([
        fetchConfig(accessToken, sheetId),
        fetchDailyLog(accessToken, sheetId),
        getStartDate(accessToken, sheetId),
      ])
      const activeStartDate = isValidIsoDate(fetchedStartDate) ? fetchedStartDate : get().startDate
      const { dayNumber, weekNumber } = getCurrentDayInfo(log, activeStartDate, madridTodayIso)
      const selectedRow = resolveDayRow(log, dayNumber, weekNumber, activeStartDate, madridTodayIso)
      const flashcardStreak = computeStreakForField(log.filter(r => r.date && isIsoOnOrBefore(r.date, madridTodayIso)), 'flashcard_done')
      const gymStreak = computeStreakForField(log.filter(r => r.date && isIsoOnOrBefore(r.date, madridTodayIso)), 'gym_done')
      set({
        startDate: activeStartDate,
        configRows: config,
        dailyLog: log,
        selectedRow,
        currentDayNumber: dayNumber,
        currentWeekNumber: weekNumber,
        selectedDayNumber: dayNumber,
        selectedWeekNumber: weekNumber,
        madridDateIso: madridTodayIso,
        lastSynced: new Date(),
        flashcardStreak,
        gymStreak,
        syncing: false,
      })
    } catch (e) {
      const { dailyLog, currentDayNumber, currentWeekNumber, startDate } = get()
      const madridTodayIso = getMadridTodayIso()
      set({
        error: (e as Error).message,
        syncing: false,
        madridDateIso: madridTodayIso,
        selectedRow: resolveDayRow(dailyLog, currentDayNumber, currentWeekNumber, startDate, madridTodayIso),
        selectedDayNumber: currentDayNumber,
        selectedWeekNumber: currentWeekNumber,
      })
    }
  },

  updateTodayField: (key, value) => {
    const { selectedRow, selectedDayNumber, selectedWeekNumber, startDate, madridDateIso } = get()
    const baseRow = selectedRow ?? resolveDayRow([], selectedDayNumber, selectedWeekNumber, startDate, madridDateIso)
    set({ selectedRow: { ...baseRow, [key]: value } })
  },

  goToRelativeDay: (delta) => {
    if (!Number.isFinite(delta) || delta === 0) return
    const { selectedDayNumber, dailyLog, startDate, madridDateIso } = get()
    const targetDayNumber = clampDayNumber(selectedDayNumber + Math.round(delta))
    if (targetDayNumber === selectedDayNumber) return
    const targetWeekNumber = Math.ceil(targetDayNumber / 7)
    set({
      selectedDayNumber: targetDayNumber,
      selectedWeekNumber: targetWeekNumber,
      selectedRow: resolveDayRow(dailyLog, targetDayNumber, targetWeekNumber, startDate, madridDateIso),
    })
  },

  goToToday: () => {
    const { currentDayNumber, currentWeekNumber, dailyLog, startDate, madridDateIso } = get()
    set({
      selectedDayNumber: currentDayNumber,
      selectedWeekNumber: currentWeekNumber,
      selectedRow: resolveDayRow(dailyLog, currentDayNumber, currentWeekNumber, startDate, madridDateIso),
    })
  },

  refreshCurrentDayFromDeviceTime: () => {
    const { dailyLog, startDate, madridDateIso, currentDayNumber, selectedDayNumber } = get()
    const localTodayIso = getMadridTodayIso()
    if (localTodayIso === madridDateIso) return false

    const { dayNumber, weekNumber } = getCurrentDayInfo(dailyLog, startDate, localTodayIso)
    const wasViewingCurrentDay = selectedDayNumber === currentDayNumber
    const nextSelectedDayNumber = wasViewingCurrentDay ? dayNumber : selectedDayNumber
    const nextSelectedWeekNumber = Math.ceil(nextSelectedDayNumber / 7)

    set({
      madridDateIso: localTodayIso,
      currentDayNumber: dayNumber,
      currentWeekNumber: weekNumber,
      selectedDayNumber: nextSelectedDayNumber,
      selectedWeekNumber: nextSelectedWeekNumber,
      selectedRow: resolveDayRow(dailyLog, nextSelectedDayNumber, nextSelectedWeekNumber, startDate, localTodayIso),
      flashcardStreak: computeStreakForField(dailyLog.filter(r => r.date && isIsoOnOrBefore(r.date, localTodayIso)), 'flashcard_done'),
      gymStreak: computeStreakForField(dailyLog.filter(r => r.date && isIsoOnOrBefore(r.date, localTodayIso)), 'gym_done'),
    })
    return true
  },

  saveDay: async (updates) => {
    const {
      accessToken,
      sheetId,
      selectedRow,
      dailyLog,
      selectedDayNumber,
      selectedWeekNumber,
      startDate,
      madridDateIso,
    } = get()
    if (!accessToken || !sheetId) return
    const baseRow = selectedRow ?? resolveDayRow(dailyLog, selectedDayNumber, selectedWeekNumber, startDate, madridDateIso)
    const updated = { ...baseRow, ...updates }
    set({ selectedRow: updated, syncing: true })
    try {
      await writeDayLog(accessToken, sheetId, updated.day_number, dailyRowToArray(updated))
      const hasExistingDay = dailyLog.some(r => r.day_number === updated.day_number)
      const newLog = hasExistingDay
        ? dailyLog.map(r => r.day_number === updated.day_number ? updated : r)
        : [...dailyLog, updated].sort((a, b) => a.day_number - b.day_number)
      const flashcardStreak = computeStreakForField(newLog.filter(r => r.date && isIsoOnOrBefore(r.date, madridDateIso)), 'flashcard_done')
      const gymStreak = computeStreakForField(newLog.filter(r => r.date && isIsoOnOrBefore(r.date, madridDateIso)), 'gym_done')
      set({
        dailyLog: newLog,
        selectedRow: updated,
        flashcardStreak,
        gymStreak,
        syncing: false,
        lastSynced: new Date(),
      })
    } catch (e) {
      set({ error: (e as Error).message, syncing: false })
    }
  },
}))
