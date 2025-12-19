import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AdminAuditPage({ searchParams }: { searchParams?: { action?: string; adminId?: string; targetType?: string } }) {
  await requireAdmin()
  const action = searchParams?.action || ''
  const adminId = searchParams?.adminId || ''
  const targetType = searchParams?.targetType || ''

  const where: any = {}
  if (action) where.action = action
  if (adminId) where.adminId = adminId
  if (targetType) where.targetType = targetType

  const logs = await prisma.adminAction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Audit Log</h1>
        <form className="flex gap-3 mb-4" method="get">
          <input name="action" placeholder="Action type" defaultValue={action} className="border rounded px-3 py-2 text-sm" />
          <input name="adminId" placeholder="Admin ID" defaultValue={adminId} className="border rounded px-3 py-2 text-sm" />
          <input name="targetType" placeholder="Target type" defaultValue={targetType} className="border rounded px-3 py-2 text-sm" />
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Filter</button>
        </form>
        <div className="bg-white rounded-lg shadow p-6">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.adminId}</td>
                  <td>{log.action}</td>
                  <td>{log.targetType} {log.targetId}</td>
                  <td>{log.metadata}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
