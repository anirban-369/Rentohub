"use client"
import { useState } from "react"

export default function AdminBookingActions({ bookingId, status, onAction }: { bookingId: string; status: string; onAction?: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleAction(type: "cancel" | "complete" | "refund") {
    setLoading(type)
    setError(null)
    setSuccess(null)
    try {
      let result
      if (type === "cancel") {
        const { adminCancelBookingAction } = await import("@/app/actions/admin")
        result = await adminCancelBookingAction(bookingId)
      } else if (type === "complete") {
        const { adminCompleteBookingAction } = await import("@/app/actions/admin")
        result = await adminCompleteBookingAction(bookingId)
      } else if (type === "refund") {
        const amount = prompt("Refund amount?")
        if (!amount) throw new Error("No amount entered")
        const { adminRefundBookingAction } = await import("@/app/actions/admin")
        result = await adminRefundBookingAction(bookingId, Number(amount))
      }
      if (result?.success) {
        setSuccess("Action successful")
        if (onAction) onAction()
      } else {
        setError(result?.error || "Unknown error")
      }
    } catch (err: any) {
      setError(err.message || "Error")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      {status !== "CANCELLED" && (
        <button
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
          disabled={!!loading}
          onClick={() => handleAction("cancel")}
        >
          Cancel
        </button>
      )}
      {status !== "COMPLETED" && (
        <button
          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
          disabled={!!loading}
          onClick={() => handleAction("complete")}
        >
          Complete
        </button>
      )}
      <button
        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
        disabled={!!loading}
        onClick={() => handleAction("refund")}
      >
        Refund
      </button>
      {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
      {success && <span className="text-xs text-green-600 ml-2">{success}</span>}
    </div>
  )
}
