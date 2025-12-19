import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import Link from 'next/link'
import { getProxyImageUrl } from '@/lib/image-utils'
import { getAllListingsAction } from '@/app/actions/admin'
import AdminListingActions from '@/components/AdminListingActions'

type Props = {
  searchParams?: {
    page?: string
    q?: string
  }
}

export default async function AdminListingsPage({ searchParams }: Props) {
  await requireAdmin()

  const page = Math.max(1, Number(searchParams?.page) || 1)
  const query = searchParams?.q || ''

  const result = await getAllListingsAction({ page, query })
  const listings = result.success ? result.listings : []
  const total = result.success ? result.total || 0 : 0
  const pageSize = result.success ? result.pageSize || 20 : 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">All Listings</h1>

        <div className="flex items-center justify-between mb-4">
          <form className="w-full max-w-md" action="/admin/listings" method="get">
            <div className="relative">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by title, description, category"
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
          <div className="text-sm text-gray-600">{total} listings</div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price/Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {listing.images.length > 0 && (
                          <img
                            src={getProxyImageUrl(listing.images[0])}
                            alt={listing.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <Link
                          href={`/listings/${listing.id}`}
                          className="font-medium hover:text-primary-600"
                        >
                          {listing.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {listing.user.name}
                    </td>
                    <td className="px-6 py-4 text-sm">{listing.category}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ₹{listing.pricePerDay}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          listing.isAvailable && !listing.isPaused
                            ? 'bg-green-100 text-green-700'
                            : listing.isPaused
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {listing.isPaused ? 'PAUSED' : listing.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {listing._count.bookings}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(listing.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <AdminListingActions listingId={listing.id} initialPaused={listing.isPaused} />
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
              href={`/admin/listings?page=${Math.max(1, page - 1)}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`px-3 py-1 rounded border ${page === 1 ? 'text-gray-400 border-gray-200' : 'border-gray-300 hover:bg-gray-50'}`}
              aria-disabled={page === 1}
            >
              Prev
            </Link>
            <Link
              href={`/admin/listings?page=${Math.min(totalPages, page + 1)}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
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
