import React from 'react'
import type { DailyLogRow } from '../types'

interface Props {
  log: DailyLogRow[]
  field: 'flashcard_done' | 'gym_done' | 'class_attended'
}

export default function HeatmapCalendar({ log, field }: Props) {
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
              const done = day[field] as boolean
              const hasDate = !!day.date
              return (
                <div
                  key={di}
                  title={`Day ${day.day_number}: ${done ? '✓' : hasDate ? '✗' : '—'}`}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    !hasDate ? 'bg-[#16213E]' :
                    done ? 'bg-[#4CAF50]' : 'bg-[#F44336]/60'
                  }`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-[#B0BEC5]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#4CAF50] inline-block" /> Done</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#F44336]/60 inline-block" /> Missed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#16213E] inline-block" /> Future</span>
      </div>
    </div>
  )
}
