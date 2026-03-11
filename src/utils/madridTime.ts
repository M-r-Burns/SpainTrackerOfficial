export const DEVICE_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function getDatePartsInTimeZone(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find(p => p.type === 'year')?.value)
  const month = Number(parts.find(p => p.type === 'month')?.value)
  const day = Number(parts.find(p => p.type === 'day')?.value)

  return { year, month, day }
}

function toIsoDate(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

function getUtcDateFromIso(isoDate: string): Date | null {
  if (!isIsoDate(isoDate)) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function getMadridTodayIso(): string {
  return toIsoDate(getDatePartsInTimeZone(new Date(), DEVICE_TIME_ZONE))
}

export function getMadridNowTimeLabel(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DEVICE_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date())
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = getUtcDateFromIso(isoDate)
  if (!date || !Number.isFinite(days)) return isoDate
  date.setUTCDate(date.getUTCDate() + Math.round(days))
  return date.toISOString().slice(0, 10)
}

export function getIsoDayDifference(startIsoDate: string, endIsoDate: string): number {
  const start = getUtcDateFromIso(startIsoDate)
  const end = getUtcDateFromIso(endIsoDate)
  if (!start || !end) return 0
  return Math.floor((end.getTime() - start.getTime()) / 86400000)
}

export function isIsoOnOrBefore(referenceIsoDate: string, compareToIsoDate: string): boolean {
  if (!isIsoDate(referenceIsoDate) || !isIsoDate(compareToIsoDate)) return false
  return referenceIsoDate <= compareToIsoDate
}

export function isOnOrBeforeMadridToday(isoDate: string): boolean {
  return isIsoOnOrBefore(isoDate, getMadridTodayIso())
}

export function getWeekdayNameFromIso(isoDate: string, locale = 'en-US'): string {
  const date = getUtcDateFromIso(isoDate)
  if (!date) return ''
  return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: DEVICE_TIME_ZONE }).format(date)
}

export function getWeekdayIndexFromIso(isoDate: string): number {
  const date = getUtcDateFromIso(isoDate)
  if (!date) return 0
  return date.getUTCDay()
}

export function formatIsoDateForDisplay(
  isoDate: string,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string {
  const date = getUtcDateFromIso(isoDate)
  if (!date) return isoDate
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: DEVICE_TIME_ZONE }).format(date)
}
