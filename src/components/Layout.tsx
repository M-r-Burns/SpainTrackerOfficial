import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-dvh bg-[#0D0D1A]">
      <main className="flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
