import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminUserStatusActions from '@/components/AdminUserStatusActions'
import AdminUserRoleSelect from '@/components/AdminUserRoleSelect'

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const userId = params.id

  const user = (await prisma.user.findUnique({
    where: { id: userId },
    select: ({
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      deliveryAddress: true,
      deliveryCity: true,
      deliveryState: true,
      deliveryZipCode: true,
      isSuspended: true,
      isBanned: true,
      suspensionReason: true,
      bannedReason: true,
      kyc: {
        select: {
          id: true,
          status: true,
          userId: true,
          idProofUrl: true,
          addressProofUrl: true,
          rejectionReason: true,
          submittedAt: true,
          reviewedAt: true,
          reviewedBy: true,
        },
      },
      listings: {
        select: { id: true, title: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      bookingsAsRenter: {
        select: {
          id: true,
          status: true,
          requestedAt: true,
          listing: { select: { id: true, title: true } },
        },
        take: 10,
        orderBy: { requestedAt: 'desc' },
      },
      bookingsAsLender: {
        select: {
          id: true,
          status: true,
          requestedAt: true,
          listing: { select: { id: true, title: true } },
        },
        take: 10,
        orderBy: { requestedAt: 'desc' },
      },
    } as any),
  })) as any

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-red-600">User not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">User Profile</h1>
          <Link href="/admin/users" className="text-sm text-blue-600">← Back</Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold">{user.name}</div>
              <div className="text-gray-600">{user.email}</div>
              <div className="text-sm text-gray-500">Role: {user.role}</div>
              <div className="text-sm mt-2">
                Status: {user.isBanned ? 'BANNED' : user.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
              </div>
              {user.isSuspended && user.suspensionReason && (
                <div className="text-xs text-gray-500">Reason: {user.suspensionReason}</div>
              )}
              {user.isBanned && user.bannedReason && (
                <div className="text-xs text-gray-500">Reason: {user.bannedReason}</div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <AdminUserRoleSelect userId={user.id} initialRole={user.role} />
              <AdminUserStatusActions userId={user.id} isSuspended={!!user.isSuspended} isBanned={!!user.isBanned} />
            </div>
          </div>

          <form action={async (formData) => {
            'use server'
            const name = formData.get('name')?.toString()
            const phone = formData.get('phone')?.toString()
            const deliveryAddress = formData.get('deliveryAddress')?.toString()
            const deliveryCity = formData.get('deliveryCity')?.toString()
            const deliveryState = formData.get('deliveryState')?.toString()
            const deliveryZipCode = formData.get('deliveryZipCode')?.toString()
            const { adminUpdateUserProfileAction } = await import('@/app/actions/admin')
            await adminUpdateUserProfileAction(user.id, { name, phone, deliveryAddress, deliveryCity, deliveryState, deliveryZipCode })
          }} className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500">Name</label>
              <input name="name" defaultValue={user.name || ''} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Phone</label>
              <input name="phone" defaultValue={user.phone || ''} className="border rounded w-full px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500">Delivery Address</label>
              <input name="deliveryAddress" defaultValue={user.deliveryAddress || ''} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Delivery City</label>
              <input name="deliveryCity" defaultValue={user.deliveryCity || ''} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Delivery State</label>
              <input name="deliveryState" defaultValue={user.deliveryState || ''} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Delivery Zip</label>
              <input name="deliveryZipCode" defaultValue={user.deliveryZipCode || ''} className="border rounded w-full px-3 py-2" />
            </div>
            <div className="col-span-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Recent Listings</h2>
          <ul className="space-y-2">
            {user.listings.map((l: { id: string; title: string }) => (
              <li key={l.id} className="flex items-center justify-between">
                <Link href={`/listings/${l.id}`} className="text-blue-600">{l.title}</Link>
                <Link href={`/admin/listings/${l.id}`} className="text-sm text-gray-600">Edit</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Recent Bookings (as Renter)</h2>
          <ul className="space-y-2">
            {user.bookingsAsRenter.map((b: { id: string; status: string; listing: { id: string; title: string } }) => (
              <li key={b.id} className="flex items-center justify-between">
                <span className="text-gray-700">{b.listing.title}</span>
                <span className="text-xs text-gray-500">{b.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Recent Bookings (as Lender)</h2>
          <ul className="space-y-2">
            {user.bookingsAsLender.map((b: { id: string; status: string; listing: { id: string; title: string } }) => (
              <li key={b.id} className="flex items-center justify-between">
                <span className="text-gray-700">{b.listing.title}</span>
                <span className="text-xs text-gray-500">{b.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
