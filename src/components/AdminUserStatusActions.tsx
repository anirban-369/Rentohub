"use client"

import { useState } from 'react'
import { adminSuspendUserAction, adminUnsuspendUserAction, adminBanUserAction, adminUnbanUserAction } from '@/app/actions/admin'

export default function AdminUserStatusActions({ userId, isSuspended, isBanned }: { userId: string; isSuspended: boolean; isBanned: boolean }) {
  const [suspended, setSuspended] = useState(isSuspended)
  const [banned, setBanned] = useState(isBanned)
  const [loading, setLoading] = useState(false)

  async function suspend() {
    const reason = prompt('Suspension reason (optional):') || undefined
    setLoading(true)
    try {
      const r = await adminSuspendUserAction(userId, reason)
      if (r.success) setSuspended(true)
    } finally { setLoading(false) }
  }

  async function unsuspend() {
    setLoading(true)
    try {
      const r = await adminUnsuspendUserAction(userId)
      if (r.success) setSuspended(false)
    } finally { setLoading(false) }
  }

  async function ban() {
    const reason = prompt('Ban reason (optional):') || undefined
    if (!confirm('Ban this user? They will be blocked from all access.')) return
    setLoading(true)
    try {
      const r = await adminBanUserAction(userId, reason)
      if (r.success) setBanned(true)
    } finally { setLoading(false) }
  }

  async function unban() {
    if (!confirm('Unban this user?')) return
    setLoading(true)
    try {
      const r = await adminUnbanUserAction(userId)
      if (r.success) setBanned(false)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-2">
      {suspended ? (
        <button onClick={unsuspend} disabled={loading} className="px-3 py-1 text-xs rounded border border-green-300 text-green-700 hover:bg-green-50">Unsuspend</button>
      ) : (
        <button onClick={suspend} disabled={loading} className="px-3 py-1 text-xs rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50">Suspend</button>
      )}
      {banned ? (
        <button onClick={unban} disabled={loading} className="px-3 py-1 text-xs rounded border border-green-300 text-green-700 hover:bg-green-50">Unban</button>
      ) : (
        <button onClick={ban} disabled={loading} className="px-3 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50">Ban</button>
      )}
    </div>
  )
}
