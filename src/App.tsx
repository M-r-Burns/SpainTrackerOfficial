import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import TodayView from './views/TodayView'
import WeekView from './views/WeekView'
import OverallView from './views/OverallView'
import HistoryView from './views/HistoryView'
import SettingsView from './views/SettingsView'
import { useProgressStore } from './store/useProgressStore'
import { handleOAuthCallback, refreshAccessToken } from './auth/googleAuth'

export default function App() {
  const { setAuth, syncData, setSheetId } = useProgressStore()

  useEffect(() => {
    const savedSheetId = localStorage.getItem('sheet_id')
    if (savedSheetId) setSheetId(savedSheetId)

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    if (code && state) {
      handleOAuthCallback(code, state)
        .then(token => {
          setAuth(token)
          window.history.replaceState({}, '', '/')
          syncData()
        })
        .catch(console.error)
      return
    }

    refreshAccessToken().then(token => {
      if (token) {
        setAuth(token)
        syncData()
      }
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TodayView />} />
          <Route path="week" element={<WeekView />} />
          <Route path="overall" element={<OverallView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
