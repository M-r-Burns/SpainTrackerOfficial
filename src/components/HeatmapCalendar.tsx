import React from 'react'
import type { DailyLogRow } from '../types'
import { isOnOrBeforeMadridToday } from '../utils/madridTime'

interface Props {
  log: DailyLogRow[]
}

function getDayLevel(row: DailyLogRow): { level: -1 | 0 | 1 | 2 | 3; label: string } {
  if (!row.date) return { level: -1, label: 'No date' }
  if (!isOnOrBeforeMadridToday(row.date)) return { level: -1, label: 'Future' }

  const checks = [
    row.flashcard_done,
    row.gym_done,
    row.book_chapter_completed,
    row.walk_used_for_listening,
    row.podcast_done > 0,
    row.app_hours > 0,
    row.job_apps_sent > 0,
    row.conversations_count > 0,
    ...(row.is_class_day ? [row.class_attended] : []),
  ]

  const completedCount = checks.filter(Boolean).length
  const ratio = checks.length > 0 ? completedCount / checks.length : 0

  if (completedCount === 0) return { level: 0, label: 'No progress' }
  if (ratio < 0.34) return { level: 1, label: 'Light progress' }
  if (ratio < 0.67) return { level: 2, label: 'Solid progress' }
  return { level: 3, label: 'Strong progress' }
}

export default function HeatmapCalendar({ log }: Props) {
  const sorted = [...log].sort((a, b) => a.day_number - b.day_number)
  const weeks: DailyLogRow[][] = []
  for (let i = 0; i < sorted.length; i += 7) {
    weeks.push(sorted.slice(i, i + 7))
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              const { level, label } = getDayLevel(day)
              return (
                <div
                  key={di}
                  title={`Day ${day.day_number}: ${label}`}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    level < 0 ? 'bg-[#16213E]' :
                    level === 3 ? 'bg-[#4CAF50]' :
                    level === 2 ? 'bg-[#4FC3F7]/70' :
                    level === 1 ? 'bg-[#E65100]/70' :
                    'bg-[#F44336]/60'
                  }`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-[#B0BEC5]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#4CAF50] inline-block" /> Strong</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#4FC3F7]/70 inline-block" /> Solid</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#E65100]/70 inline-block" /> Light</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#F44336]/60 inline-block" /> None</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#16213E] inline-block" /> Future</span>
      </div>
    </div>
  )
}
