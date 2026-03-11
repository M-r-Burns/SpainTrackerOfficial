import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, LogOut, RefreshCw, CheckCircle, XCircle, Link } from 'lucide-react'
import { useProgressStore } from '../store/useProgressStore'
import { startOAuthFlow, logout } from '../auth/googleAuth'

export default function SettingsView() {
  const { isAuthenticated, sheetId, setSheetId, syncData, syncing, lastSynced, error } = useProgressStore()
  const envSheetId = import.meta.env.VITE_SHEET_ID || ''
  const [localSheetId, setLocalSheetId] = useState(sheetId)

  function handleLogout() {
    logout()
    window.location.reload()
  }

  function handleSaveSheetId() {
    setSheetId(localSheetId)
  }

  return (
    <motion.div className="p-4 max-w-lg mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-3">Google Account</h2>
        <div className="flex items-center gap-3 mb-4">
          {isAuthenticated
            ? <><CheckCircle size={20} className="text-[#4CAF50]" /><span className="text-[#4CAF50] text-sm">Connected</span></>
            : <><XCircle size={20} className="text-[#F44336]" /><span className="text-[#F44336] text-sm">Not connected</span></>
          }
        </div>
        {isAuthenticated ? (
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#F44336]/20 text-[#F44336] border border-[#F44336]/30 py-3 rounded-xl text-sm font-semibold">
            <LogOut size={16} /> Sign Out
          </button>
        ) : (
          <button onClick={startOAuthFlow}
            className="w-full flex items-center justify-center gap-2 bg-[#E94560] text-white py-3 rounded-xl text-sm font-semibold">
            <LogIn size={16} /> Sign in with Google
          </button>
        )}
      </div>

      <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-3">Google Sheet</h2>
        {envSheetId ? (
          <p className="text-sm text-[#B0BEC5]">
            Using sheet ID supplied via environment. You do not need to enter anything here.
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={localSheetId}
                onChange={e => setLocalSheetId(e.target.value)}
                placeholder="Paste your Sheet ID here"
                className="flex-1 bg-[#16213E] rounded-xl px-3 py-2 text-sm text-white placeholder-[#B0BEC5]/50 outline-none focus:ring-2 focus:ring-[#E94560]/50"
              />
              <button onClick={handleSaveSheetId}
                className="bg-[#E94560] text-white px-3 py-2 rounded-xl text-sm font-semibold">
                Save
              </button>
            </div>
            <p className="text-xs text-[#B0BEC5] mt-2">Found in the URL: docs.google.com/spreadsheets/d/<strong className="text-white">SHEET_ID</strong>/edit</p>
          </>
        )}
      </div>

      <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-3">Data Sync</h2>
        <button onClick={syncData} disabled={syncing || !isAuthenticated}
          className="w-full flex items-center justify-center gap-2 bg-[#16213E] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
          <RefreshCw size={16} className={syncing ? 'animate-spin text-[#E94560]' : ''} />
          {syncing ? 'Syncing…' : 'Manual Sync'}
        </button>
        {lastSynced && <p className="text-xs text-[#B0BEC5] mt-2 text-center">Last synced: {lastSynced.toLocaleString()}</p>}
        {error && <p className="text-xs text-[#F44336] mt-2">{error}</p>}
      </div>

      <div className="bg-[#1A1A2E] rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-2">About</h2>
        <p className="text-xs text-[#B0BEC5]">Valencia Tracker v1.0.0</p>
        <p className="text-xs text-[#B0BEC5]">4-month immersive experience dashboard</p>
        <a href="/CONNECTION_GUIDE.md" target="_blank"
          className="inline-flex items-center gap-1 text-xs text-[#E94560] mt-2 hover:underline">
          <Link size={11} /> Connection Guide
        </a>
      </div>
    </motion.div>
  )
}
