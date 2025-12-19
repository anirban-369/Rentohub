"use client"

import { useState } from 'react'
import { adminUpdateUserRoleAction } from '@/app/actions/admin'

type Role = 'USER' | 'ADMIN' | 'DELIVERY_AGENT'

export default function AdminUserRoleSelect({
  userId,
  initialRole,
}: {
  userId: string
  initialRole: Role
}) {
  const [role, setRole] = useState<Role>(initialRole)
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as Role
    setSaving(true)
    try {
      const result = await adminUpdateUserRoleAction(userId, newRole)
      if (result.success) {
        setRole(newRole)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={handleChange}
        disabled={saving}
        className="border rounded px-2 py-1 text-xs"
      >
        <option value="USER">USER</option>
        <option value="ADMIN">ADMIN</option>
        <option value="DELIVERY_AGENT">DELIVERY_AGENT</option>
      </select>
    </div>
  )
}
