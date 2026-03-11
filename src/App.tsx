import React, { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import Layout from './components/Layout'
import TodayView from './views/TodayView'
import WeekView from './views/WeekView'
import OverallView from './views/OverallView'
import HistoryView from './views/HistoryView'
import SettingsView from './views/SettingsView'
import { useProgressStore } from './store/useProgressStore'
import { handleOAuthCallback, refreshAccessToken, startOAuthFlow, startSilentOAuthFlow } from './auth/googleAuth'
import { getRuntimeConfig } from './config/runtimeConfig'

function LoginScreen({ error }: { error: string | null }) {
  const [signingIn, setSigningIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function handleLogin() {
    setSigningIn(true)
    setLoginError(null)
    try {
      await startOAuthFlow()
    } catch (e) {
      setLoginError((e as Error).message)
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#0D0D1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1A1A2E] border border-[#16213E] rounded-2xl p-5 shadow-2xl">
        <p className="text-xs text-[#4FC3F7] font-semibold uppercase tracking-wider mb-2">Spain Tracker</p>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-sm text-[#B0BEC5] mb-5">Sign in to open your Home dashboard and update your daily progress.</p>
        <button
          onClick={handleLogin}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-2 bg-[#4FC3F7] text-[#0F2027] py-3 rounded-xl text-sm font-semibold disabled:opacity-70"
        >
          <LogIn size={16} />
          {signingIn ? 'Redirecting…' : 'Sign in with Google'}
        </button>
        {(loginError || error) && <p className="text-xs text-[#F44336] mt-3">{loginError || error}</p>}
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, setAuth, syncData, setSheetId } = useProgressStore()
  const [authBootstrapping, setAuthBootstrapping] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const shouldTrySilentReauth = () => {
    const everAuthenticated = localStorage.getItem('ever_authenticated') === '1'
    const triedThisSession = sessionStorage.getItem('silent_oauth_attempted') === '1'
    return everAuthenticated && !triedThisSession
  }

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        const runtimeConfig = await getRuntimeConfig()
        if (runtimeConfig.sheetId) {
          setSheetId(runtimeConfig.sheetId)
        } else {
          const savedSheetId = localStorage.getItem('sheet_id')
          if (savedSheetId) setSheetId(savedSheetId)
        }

        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')
        const oauthError = params.get('error')

        if (oauthError) {
          window.history.replaceState({}, '', '/')
          if (oauthError !== 'login_required' && active) {
            setAuthError(oauthError)
          }
        }

        if (code && state) {
          const token = await handleOAuthCallback(code, state)
          setAuth(token)
          window.history.replaceState({}, '', '/')
          await syncData()
          return
        }

        const token = await refreshAccessToken()
        if (token) {
          setAuth(token)
          await syncData()
          return
        }

        if (shouldTrySilentReauth()) {
          sessionStorage.setItem('silent_oauth_attempted', '1')
          await startSilentOAuthFlow()
        }
      } catch (e) {
        if (active) setAuthError((e as Error).message)
      } finally {
        if (active) setAuthBootstrapping(false)
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return
      const token = await refreshAccessToken()
      if (token) {
        setAuth(token)
        await syncData()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isAuthenticated, setAuth, syncData])

  if (authBootstrapping) {
    return (
      <div className="min-h-dvh bg-[#0D0D1A] flex items-center justify-center">
        <p className="text-sm text-[#B0BEC5]">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen error={authError} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TodayView />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="week" element={<WeekView />} />
          <Route path="overall" element={<OverallView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
