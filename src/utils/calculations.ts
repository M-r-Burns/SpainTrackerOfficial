import type { ConfigRow, DailyLogRow, CategoryProgress } from '../types'

export function computeStreaks(log: DailyLogRow[]): { flashcard: number; gym: number } {
  return {
    flashcard: computeStreakForField(log, 'flashcard_done'),
    gym: computeStreakForField(log, 'gym_done'),
  }
}

export function computeStreakForField(
  log: DailyLogRow[],
  field: 'flashcard_done' | 'gym_done'
): number {
  const sorted = [...log].filter(r => r.date).sort((a, b) => b.day_number - a.day_number)
  let streak = 0
  for (const row of sorted) {
    if (row[field]) streak++
    else break
  }
  return streak
}

export function computeAheadBehind(
  actual: number,
  cumulativeTarget: number,
  daysElapsedThisWeek: number
): number {
  const expected = (cumulativeTarget * daysElapsedThisWeek) / 7
  return actual - expected
}

export function computePct(actual: number, target: number): number {
  if (target === 0) return 0
  return Math.min(100, Math.round((actual / target) * 100))
}

export function getCumulativeTarget(
  config: ConfigRow[],
  upToWeek: number,
  field: keyof Pick<ConfigRow, 'app_hours_target' | 'job_apps_target' | 'gym_days_target' | 'podcast_hours_target' | 'book_chapters_target' | 'class_days_target'>
): number {
  return config
    .filter(c => c.week_number <= upToWeek)
    .reduce((sum, c) => sum + (c[field] as number), 0)
}

export function getWeekCategoryProgress(
  config: ConfigRow[],
  log: DailyLogRow[],
  weekNumber: number
): CategoryProgress[] {
  const weekConfig = config.find(c => c.week_number === weekNumber)
  if (!weekConfig) return []

  const weekLog = log.filter(r => r.week_number === weekNumber)
  const today = new Date()
  const daysElapsed = weekLog.filter(r => r.date && new Date(r.date) <= today).length

  const categories: CategoryProgress[] = [
    {
      name: 'Spanish',
      color: '#1565C0',
      actual: weekLog.filter(r => r.class_attended).length,
      target: weekConfig.class_days_target,
      pct: 0,
      aheadBehind: 0,
    },
    {
      name: 'App Dev',
      color: '#2E7D32',
      actual: weekLog.reduce((s, r) => s + r.app_hours, 0),
      target: weekConfig.app_hours_target,
      pct: 0,
      aheadBehind: 0,
    },
    {
      name: 'Jobs',
      color: '#E65100',
      actual: weekLog.reduce((s, r) => s + r.job_apps_sent, 0),
      target: weekConfig.job_apps_target,
      pct: 0,
      aheadBehind: 0,
    },
    {
      name: 'Gym',
      color: '#6A1B9A',
      actual: weekLog.filter(r => r.gym_done).length,
      target: weekConfig.gym_days_target,
      pct: 0,
      aheadBehind: 0,
    },
    {
      name: 'Podcast',
      color: '#00695C',
      actual: weekLog.reduce((s, r) => s + r.podcast_done, 0),
      target: weekConfig.podcast_hours_target,
      pct: 0,
      aheadBehind: 0,
    },
  ]

  return categories.map(cat => ({
    ...cat,
    pct: computePct(cat.actual, cat.target),
    aheadBehind: computeAheadBehind(cat.actual, cat.target, daysElapsed),
  }))
}

export function getOverallCategoryProgress(
  config: ConfigRow[],
  log: DailyLogRow[],
  currentWeek: number,
  currentDayInWeek: number
): CategoryProgress[] {
  const totalWeeks = 16
  const today = new Date()

  const loggedDays = log.filter(r => r.date && new Date(r.date) <= today)

  const actuals = {
    spanish: loggedDays.filter(r => r.class_attended).length,
    app: loggedDays.reduce((s, r) => s + r.app_hours, 0),
    jobs: loggedDays.reduce((s, r) => s + r.job_apps_sent, 0),
    gym: loggedDays.filter(r => r.gym_done).length,
    life: loggedDays.filter(r => r.life_event && r.life_event.trim() !== '').length,
  }

  const fullTarget = (field: keyof Pick<ConfigRow, 'app_hours_target' | 'job_apps_target' | 'gym_days_target' | 'class_days_target' | 'podcast_hours_target'>) =>
    config.reduce((s, c) => s + (c[field] as number), 0)

  const categories: CategoryProgress[] = [
    {
      name: 'Spanish',
      color: '#1565C0',
      actual: actuals.spanish,
      target: fullTarget('class_days_target'),
      pct: 0,
      aheadBehind: 0,
    },
    {
      name: 'App Dev',
      color: '#2E7D32',
      actual: actuals.app,
      target: fullTarget('app_hours_target'),
      pct: 0,
      aheadBehind: 0,
    },
    {
      name: 'Jobs',
      color: '#E65100',
      actual: actuals.jobs,
      target: fullTarget('job_apps_target'),
      pct: 0,
      aheadBehind: 0,
    },
    {
      name: 'Gym',
      color: '#6A1B9A',
      actual: actuals.gym,
      target: fullTarget('gym_days_target'),
      pct: 0,
      aheadBehind: 0,
    },
    {
      name: 'Life Events',
      color: '#00695C',
      actual: actuals.life,
      target: totalWeeks * 3,
      pct: 0,
      aheadBehind: 0,
    },
  ]

  const cumulativeTarget = (field: keyof Pick<ConfigRow, 'app_hours_target' | 'job_apps_target' | 'gym_days_target' | 'class_days_target' | 'podcast_hours_target'>) =>
    getCumulativeTarget(config, currentWeek, field)

  return categories.map((cat, i) => {
    const cumTarget = i === 0 ? cumulativeTarget('class_days_target')
      : i === 1 ? cumulativeTarget('app_hours_target')
      : i === 2 ? cumulativeTarget('job_apps_target')
      : i === 3 ? cumulativeTarget('gym_days_target')
      : currentWeek * 3
    return {
      ...cat,
      pct: computePct(cat.actual, cat.target),
      aheadBehind: computeAheadBehind(cat.actual, cumTarget, currentDayInWeek),
    }
  })
}
