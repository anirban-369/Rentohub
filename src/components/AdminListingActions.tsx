"use client"

import { useState } from 'react'
import { toggleListingPauseAdminAction, deleteListingAdminAction } from '@/app/actions/admin'

export default function AdminListingActions({
  listingId,
  initialPaused,
}: {
  listingId: string
  initialPaused: boolean
}) {
  const [paused, setPaused] = useState(initialPaused)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleTogglePause() {
    setLoading(true)
    try {
      const result = await toggleListingPauseAdminAction(listingId)
      if (result.success) {
        setPaused(!!result.isPaused)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(true)
    try {
      const result = await deleteListingAdminAction(listingId)
      if (result.success) {
        // Let the parent page re-render via revalidatePath
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTogglePause}
        disabled={loading}
        className={`px-3 py-1 text-xs rounded border transition ${
          paused
            ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
            : 'border-green-300 text-green-700 hover:bg-green-50'
        } disabled:opacity-50`}
      >
        {loading ? 'Updating…' : paused ? 'Resume' : 'Pause'}
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-3 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
