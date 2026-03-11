const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function readRange(token: string, sheetId: string, range: string): Promise<string[][]> {
  const url = `${BASE}/${sheetId}/values/${encodeURIComponent(range)}`
  const res = await fetch(url, { headers: headers(token) })
  if (!res.ok) throw new Error(`Sheets read error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return (data.values as string[][]) ?? []
}

export async function writeRange(
  token: string,
  sheetId: string,
  range: string,
  values: (string | number | boolean)[][]
): Promise<void> {
  const url = `${BASE}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`
  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  })
  if (!res.ok) throw new Error(`Sheets write error ${res.status}: ${await res.text()}`)
}

export async function getStartDate(token: string, sheetId: string): Promise<string> {
  const rows = await readRange(token, sheetId, 'Config!A1:Z200')
  if (!rows.length) return ''
  const headers = rows[0].map(normalizeHeader)
  const firstData = rows[1] ?? []

  const dateStartIndex = headers.indexOf('date_start')
  if (dateStartIndex >= 0) {
    return toIsoDate(firstData[dateStartIndex] ?? '')
  }

  const legacyIndex = headers.indexOf('date_start') >= 0 ? headers.indexOf('date_start') : 3
  return toIsoDate(firstData[legacyIndex] ?? '')
}

export async function fetchConfig(token: string, sheetId: string) {
  const rows = await readRange(token, sheetId, 'Config!A1:Z200')
  if (!rows.length) return []

  const headerRow = rows[0].map(normalizeHeader)
  const dataRows = rows.slice(1).filter(row => row.some(cell => `${cell}`.trim() !== ''))

  const hasNewSchema = headerRow.includes('week_label') || headerRow.includes('target_book_chapters_cumulative')

  if (hasNewSchema) {
    const records = dataRows
      .map((row) => toRecord(headerRow, row))
      .filter(record => toNumber(record.week_number) > 0)
      .sort((a, b) => toNumber(a.week_number) - toNumber(b.week_number))

    let prevBook = 0
    let prevPodcast = 0
    let prevAppCum = 0
    let prevJobCum = 0

    return records.map(record => {
      const bookCum = toNumber(record.target_book_chapters_cumulative)
      const podcastCum = toNumber(record.target_podcast_hours_cumulative)
      const appCum = toNumber(record.target_app_hours_cumulative)
      const jobCum = toNumber(record.target_job_apps_cumulative)

      const bookWeekly = Math.max(0, bookCum - prevBook)
      const podcastWeekly = Math.max(0, podcastCum - prevPodcast)
      const appWeekly = toNumber(record.target_app_hours_weekly) || Math.max(0, appCum - prevAppCum)
      const jobWeekly = toNumber(record.target_job_apps_weekly) || Math.max(0, jobCum - prevJobCum)

      prevBook = bookCum || prevBook
      prevPodcast = podcastCum || prevPodcast
      prevAppCum = appCum || prevAppCum
      prevJobCum = jobCum || prevJobCum

      return {
        week_number: toNumber(record.week_number),
        phase: `${record.phase ?? ''}`,
        book_chapters_target: bookWeekly,
        podcast_hours_target: podcastWeekly,
        app_hours_target: appWeekly,
        job_apps_target: jobWeekly,
        gym_days_target: toNumber(record.target_gym_days),
        class_days_target: toNumber(record.target_class_days),
        week_focus: `${record.week_focus ?? ''}`,
      }
    })
  }

  return dataRows.map(r => ({
    week_number: toNumber(r[0]),
    phase: r[1] ?? '',
    book_chapters_target: toNumber(r[2]),
    podcast_hours_target: toNumber(r[3]),
    app_hours_target: toNumber(r[4]),
    job_apps_target: toNumber(r[5]),
    gym_days_target: toNumber(r[6]),
    class_days_target: toNumber(r[7]),
    week_focus: r[8] ?? '',
  }))
}

export async function fetchDailyLog(token: string, sheetId: string) {
  const rows = await readRange(token, sheetId, 'DailyLog!A1:S500')
  if (!rows.length) return []

  const headerRow = rows[0].map(normalizeHeader)
  const dataRows = rows.slice(1).filter(row => row.some(cell => `${cell}`.trim() !== ''))
  const hasHeader = headerRow.includes('day_number')

  if (hasHeader) {
    return dataRows.map((row) => {
      const record = toRecord(headerRow, row)
      const rawPodcast = record.podcast_done
      return {
        day_number: toNumber(record.day_number),
        week_number: toNumber(record.week_number),
        date: toIsoDate(record.date),
        day_of_week: `${record.day_of_week ?? ''}`,
        is_class_day: toBool(record.is_class_day),
        is_morning_class: toBool(record.is_morning_class),
        book_chapter_completed: toBool(record.book_chapter_completed),
        podcast_done: typeof rawPodcast === 'string' && /^(true|false)$/i.test(rawPodcast)
          ? (toBool(rawPodcast) ? 1 : 0)
          : toNumber(rawPodcast),
        flashcard_done: toBool(record.flashcard_done),
        class_attended: toBool(record.class_attended),
        conversations_count: toNumber(record.conversations_count),
        duolingo_test_score: toNullableNumber(record.duolingo_test_score),
        walk_used_for_listening: toBool(record.walk_used_for_listening),
        app_hours: toNumber(record.app_hours),
        job_apps_sent: toNumber(record.job_apps_sent),
        gym_done: toBool(record.gym_done),
        life_event: `${record.life_event ?? ''}`,
        energy_level: toNullableNumber(record.energy_level),
        notes: `${record.notes ?? ''}`,
      }
    })
  }

  return dataRows.map(r => ({
    day_number: toNumber(r[0]),
    week_number: toNumber(r[1]),
    date: toIsoDate(r[2]),
    day_of_week: r[3] ?? '',
    is_class_day: toBool(r[4]),
    is_morning_class: toBool(r[5]),
    book_chapter_completed: toBool(r[6]),
    podcast_done: toNumber(r[7]),
    flashcard_done: toBool(r[8]),
    class_attended: toBool(r[9]),
    conversations_count: toNumber(r[10]),
    duolingo_test_score: toNullableNumber(r[11]),
    walk_used_for_listening: toBool(r[12]),
    app_hours: toNumber(r[13]),
    job_apps_sent: toNumber(r[14]),
    gym_done: toBool(r[15]),
    life_event: r[16] ?? '',
    energy_level: toNullableNumber(r[17]),
    notes: r[18] ?? '',
  }))
}

export async function writeDayLog(
  token: string,
  sheetId: string,
  dayNumber: number,
  row: (string | number | boolean)[]
): Promise<void> {
  const sheetRow = dayNumber + 1
  await writeRange(token, sheetId, `DailyLog!A${sheetRow}:S${sheetRow}`, [row])
}

function normalizeHeader(value: string): string {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function toRecord(headers: string[], row: string[]): Record<string, string> {
  const record: Record<string, string> = {}
  headers.forEach((header, index) => {
    record[header] = row[index] ?? ''
  })
  return record
}

function toNumber(value: string | number | boolean | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (value == null) return 0
  const cleaned = `${value}`.trim()
  if (!cleaned) return 0
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function toNullableNumber(value: string | number | boolean | null | undefined): number | null {
  if (value == null) return null
  const cleaned = `${value}`.trim()
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function toBool(value: string | number | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (value == null) return false
  const normalized = `${value}`.trim().toLowerCase()
  if (!normalized) return false
  return ['true', '1', 'yes', 'y'].includes(normalized)
}

function toIsoDate(value: string | number | boolean | null | undefined): string {
  if (value == null) return ''
  const raw = `${value}`.trim()
  if (!raw) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, first, second, year] = slashMatch
    const firstNum = Number(first)
    const secondNum = Number(second)
    const month = firstNum
    const day = secondNum
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return raw
}
