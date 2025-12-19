'use client'

import Link from 'next/link'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

export default function AdminHeader() {
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    try {
      setLoggingOut(true)
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        window.location.href = '/login'
      } else {
        setLoggingOut(false)
      }
    } catch (e) {
      setLoggingOut(false)
      console.error('Logout failed', e)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-lg font-semibold text-gray-900">
            RentoHub Admin
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`px-3 py-2 rounded-lg text-sm border ${loggingOut ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  )
}
