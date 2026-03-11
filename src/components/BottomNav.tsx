import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, BarChart2, Globe, BookOpen, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/week', icon: BarChart2, label: 'Week' },
  { to: '/overall', icon: Globe, label: 'Overall' },
  { to: '/history', icon: BookOpen, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A2E] border-t border-[#16213E] safe-area-inset-bottom">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive ? 'text-[#E94560]' : 'text-[#B0BEC5]'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
