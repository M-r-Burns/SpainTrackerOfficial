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
  const rows = await readRange(token, sheetId, 'Config!D2')
  return rows[0]?.[0] ?? ''
}

export async function fetchConfig(token: string, sheetId: string) {
  const rows = await readRange(token, sheetId, 'Config!A2:I17')
  return rows.map(r => ({
    week_number: Number(r[0]),
    phase: r[1] ?? '',
    book_chapters_target: Number(r[2] ?? 0),
    podcast_hours_target: Number(r[3] ?? 0),
    app_hours_target: Number(r[4] ?? 0),
    job_apps_target: Number(r[5] ?? 0),
    gym_days_target: Number(r[6] ?? 0),
    class_days_target: Number(r[7] ?? 0),
    week_focus: r[8] ?? '',
  }))
}

export async function fetchDailyLog(token: string, sheetId: string) {
  const rows = await readRange(token, sheetId, 'DailyLog!A2:S113')
  return rows.map(r => ({
    day_number: Number(r[0]),
    week_number: Number(r[1]),
    date: r[2] ?? '',
    day_of_week: r[3] ?? '',
    is_class_day: r[4]?.toUpperCase() === 'TRUE',
    is_morning_class: r[5]?.toUpperCase() === 'TRUE',
    book_chapter_completed: r[6]?.toUpperCase() === 'TRUE',
    podcast_done: Number(r[7] ?? 0),
    flashcard_done: r[8]?.toUpperCase() === 'TRUE',
    class_attended: r[9]?.toUpperCase() === 'TRUE',
    conversations_count: Number(r[10] ?? 0),
    duolingo_test_score: r[11] ? Number(r[11]) : null,
    walk_used_for_listening: r[12]?.toUpperCase() === 'TRUE',
    app_hours: Number(r[13] ?? 0),
    job_apps_sent: Number(r[14] ?? 0),
    gym_done: r[15]?.toUpperCase() === 'TRUE',
    life_event: r[16] ?? '',
    energy_level: r[17] ? Number(r[17]) : null,
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
