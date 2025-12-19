"use client"
import { useState } from "react"

export default function AdminUserBulkActions({ selectedUserIds, onAction }: { selectedUserIds: string[]; onAction?: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleBulk(type: "suspend" | "ban") {
    setLoading(type)
    setError(null)
    setSuccess(null)
    try {
      let result
      if (type === "suspend") {
        const { adminSuspendUserAction } = await import("@/app/actions/admin")
        for (const userId of selectedUserIds) {
          await adminSuspendUserAction(userId, "Bulk suspend")
        }
      } else if (type === "ban") {
        const { adminBanUserAction } = await import("@/app/actions/admin")
        for (const userId of selectedUserIds) {
          await adminBanUserAction(userId, "Bulk ban")
        }
      }
      setSuccess("Bulk action successful")
      if (onAction) onAction()
    } catch (err: any) {
      setError(err.message || "Error")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <button
        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded"
        disabled={!!loading || selectedUserIds.length === 0}
        onClick={() => handleBulk("suspend")}
      >
        Suspend Selected
      </button>
      <button
        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded"
        disabled={!!loading || selectedUserIds.length === 0}
        onClick={() => handleBulk("ban")}
      >
        Ban Selected
      </button>
      {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
      {success && <span className="text-xs text-green-600 ml-2">{success}</span>}
    </div>
  )
}
