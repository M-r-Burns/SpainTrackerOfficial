export interface ConfigRow {
  week_number: number
  phase: string
  book_chapters_target: number
  podcast_hours_target: number
  app_hours_target: number
  job_apps_target: number
  gym_days_target: number
  class_days_target: number
  week_focus: string
}

export interface DailyLogRow {
  day_number: number
  week_number: number
  date: string
  day_of_week: string
  is_class_day: boolean
  is_morning_class: boolean
  book_chapter_completed: boolean
  podcast_done: number
  flashcard_done: boolean
  class_attended: boolean
  conversations_count: number
  duolingo_test_score: number | null
  walk_used_for_listening: boolean
  app_hours: number
  job_apps_sent: number
  gym_done: boolean
  life_event: string
  energy_level: number | null
  notes: string
}

export interface AppState {
  isAuthenticated: boolean
  accessToken: string | null
  sheetId: string
  startDate: string
  configRows: ConfigRow[]
  dailyLog: DailyLogRow[]
  todayRow: DailyLogRow | null
  currentDayNumber: number
  currentWeekNumber: number
  loading: boolean
  syncing: boolean
  lastSynced: Date | null
  error: string | null
}

export interface StreakResult {
  flashcard: number
  gym: number
}

export interface CategoryProgress {
  name: string
  color: string
  actual: number
  target: number
  pct: number
  aheadBehind: number
}

export interface WeekProgress {
  weekNumber: number
  phase: string
  focus: string
  dateRange: string
  daysRemaining: number
  categories: CategoryProgress[]
}
