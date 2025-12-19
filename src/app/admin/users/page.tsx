import { requireAdmin } from '@/lib/auth'
import { getAllUsersAction } from '@/app/actions/admin'
import { format } from 'date-fns'
import Link from 'next/link'
import AdminUserRoleSelect from '@/components/AdminUserRoleSelect'
import AdminUserStatusActions from '@/components/AdminUserStatusActions'
import AdminUserBulkActions from '@/components/AdminUserBulkActions'
import AdminKYCResetActions from '@/components/AdminKYCResetActions'

type Props = {
  searchParams?: {
    page?: string
    q?: string
  }
}

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin()

  const page = Math.max(1, Number(searchParams?.page) || 1)
  const query = searchParams?.q || ''

  const result = await getAllUsersAction({ page, query })
  const users = result.success ? result.users : []
  const total = result.success ? result.total || 0 : 0
  const pageSize = result.success ? result.pageSize || 20 : 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <div className="flex items-center justify-between mb-4">
          <form className="w-full max-w-md" action="/admin/users" method="get">
            <div className="relative">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by name or email"
                className="w-full border rounded-lg px-4 py-2 pr-10 text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
              >
                Search
              </button>
            </div>
          </form>
          <div className="text-sm text-gray-600">{total} users</div>
        </div>

        <div className="mb-4">
          {/* Bulk actions UI */}
          <AdminUserBulkActions selectedUserIds={[]} />
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    KYC Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {user.name || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <AdminUserRoleSelect userId={user.id} initialRole={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.kycStatus === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : user.kycStatus === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : user.kycStatus === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.kycStatus || 'NOT_SUBMITTED'}
                      </span>
                      <div className="mt-1">
                        {/* KYC reset button */}
                        <AdminKYCResetActions userId={user.id} kycStatus={user.kycStatus || 'NOT_SUBMITTED'} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.isBanned ? 'bg-red-100 text-red-700' : user.isSuspended ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{user.isBanned ? 'BANNED' : user.isSuspended ? 'SUSPENDED' : 'ACTIVE'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:text-blue-700 text-sm">View</Link>
                        <AdminUserStatusActions userId={user.id} isSuspended={!!user.isSuspended} isBanned={!!user.isBanned} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600 border-t">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/admin/users?page=${Math.max(1, page - 1)}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`px-3 py-1 rounded border ${page === 1 ? 'text-gray-400 border-gray-200' : 'border-gray-300 hover:bg-gray-50'}`}
              aria-disabled={page === 1}
            >
              Prev
            </Link>
            <Link
              href={`/admin/users?page=${Math.min(totalPages, page + 1)}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`px-3 py-1 rounded border ${page >= totalPages ? 'text-gray-400 border-gray-200' : 'border-gray-300 hover:bg-gray-50'}`}
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
