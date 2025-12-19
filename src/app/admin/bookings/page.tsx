import { requireAdmin } from '@/lib/auth'
import { getAllBookingsAction } from '@/app/actions/admin'
import { format } from 'date-fns'
import Link from 'next/link'

type Props = {
  searchParams?: {
    page?: string
    q?: string
    status?: string
  }
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  await requireAdmin()

  const page = Math.max(1, Number(searchParams?.page) || 1)
  const query = searchParams?.q || ''
  const status = searchParams?.status || ''

  const result = await getAllBookingsAction({ page, query, status: status || undefined })
  const bookings = result.success ? result.bookings : []
  const total = result.success ? result.total || 0 : 0
  const pageSize = result.success ? result.pageSize || 20 : 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const statusOptions = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED']

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">All Bookings</h1>

        <form className="flex flex-wrap items-center gap-3 mb-4" action="/admin/bookings" method="get">
          <div className="flex-1 min-w-[240px]">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by listing or user"
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
          </div>
          <div>
            <select
              name="status"
              defaultValue={status}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
          >
            Apply
          </button>
          <div className="text-sm text-gray-600">{total} bookings</div>
        </form>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Renter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/listings/${booking.listing.id}`}
                        className="font-medium hover:text-primary-600"
                      >
                        {booking.listing.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.renter?.name || booking.renter?.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.lender?.name || booking.lender?.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(booking.startDate), 'MMM dd')} -{' '}
                      {format(new Date(booking.endDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          booking.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-700'
                            : booking.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'DISPUTED'
                            ? 'bg-red-100 text-red-700'
                            : booking.status === 'CANCELLED'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ₹{booking.totalAmount}
                    </td>
                    <td className="px-6 py-4">
                      {/* Booking actions */}
                      <div suppressHydrationWarning>
                        {/* @ts-ignore */}
                        <AdminBookingActions bookingId={booking.id} status={booking.status} />
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
              href={`/admin/bookings?page=${Math.max(1, page - 1)}${query ? `&q=${encodeURIComponent(query)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}`}
              className={`px-3 py-1 rounded border ${page === 1 ? 'text-gray-400 border-gray-200' : 'border-gray-300 hover:bg-gray-50'}`}
              aria-disabled={page === 1}
            >
              Prev
            </Link>
            <Link
              href={`/admin/bookings?page=${Math.min(totalPages, page + 1)}${query ? `&q=${encodeURIComponent(query)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}`}
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
