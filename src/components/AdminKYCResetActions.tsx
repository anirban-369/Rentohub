"use client"
import { useState } from "react"

export default function AdminKYCResetActions({ userId, kycStatus, onAction }: { userId: string; kycStatus: string; onAction?: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleReset() {
    setLoading("reset")
    setError(null)
    setSuccess(null)
    try {
      const { adminResetKYCAction } = await import("@/app/actions/admin")
      const result = await adminResetKYCAction(userId)
      if (result?.success) {
        setSuccess("KYC reset successful")
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
    <button
      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded"
      disabled={!!loading || kycStatus === 'PENDING'}
      onClick={handleReset}
    >
      Reset KYC
    </button>
  )
}
