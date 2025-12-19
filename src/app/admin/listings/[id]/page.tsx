import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getProxyImageUrl } from '@/lib/image-utils'

export default async function AdminListingEditPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const listingId = params.id
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { user: true } })
  if (!listing) {
    return <div className="p-8 text-red-600">Listing not found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-4 mb-6">
            {listing.images?.[0] && (
              <img src={getProxyImageUrl(listing.images[0])} alt={listing.title} className="w-24 h-24 object-cover rounded" />
            )}
            <div>
              <div className="text-lg font-semibold">{listing.title}</div>
              <div className="text-sm text-gray-600">Lender: {listing.user.name} ({listing.user.email})</div>
            </div>
          </div>

          <form action={async (formData) => {
            'use server'
            const title = formData.get('title')?.toString()
            const description = formData.get('description')?.toString()
            const category = formData.get('category')?.toString()
            const condition = formData.get('condition')?.toString()
            const pricePerDay = Number(formData.get('pricePerDay'))
            const pricePerHourValue = formData.get('pricePerHour')?.toString()
            const pricePerHour = pricePerHourValue ? Number(pricePerHourValue) : undefined
            const deposit = Number(formData.get('deposit'))
            const address = formData.get('address')?.toString()
            const city = formData.get('city')?.toString()
            const state = formData.get('state')?.toString()
            const zipCode = formData.get('zipCode')?.toString()

            const imagesRaw = formData.get('images')?.toString()
            const images = imagesRaw ? imagesRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined

            const { adminUpdateListingAction } = await import('@/app/actions/admin')
            const result = await adminUpdateListingAction(listingId, {
              title, description, category, condition, pricePerDay, pricePerHour, deposit,
              address, city, state, zipCode, images
            })
            if (result?.success) {
              // @ts-ignore
              globalThis.__listingEditSuccess = true
            }
          }} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500">Title</label>
              <input name="title" defaultValue={listing.title} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Category</label>
              <input name="category" defaultValue={listing.category} className="border rounded w-full px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500">Description</label>
              <textarea name="description" defaultValue={listing.description} className="border rounded w-full px-3 py-2" rows={4} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Condition</label>
              <input name="condition" defaultValue={listing.condition} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Price Per Day</label>
              <input type="number" step="0.01" name="pricePerDay" defaultValue={listing.pricePerDay} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Price Per Hour</label>
              <input type="number" step="0.01" name="pricePerHour" defaultValue={listing.pricePerHour ?? ''} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Deposit</label>
              <input type="number" step="0.01" name="deposit" defaultValue={listing.deposit} className="border rounded w-full px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500">Images (comma-separated URLs)</label>
              <input name="images" defaultValue={(listing.images || []).join(', ')} className="border rounded w-full px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500">Address</label>
              <input name="address" defaultValue={listing.address} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">City</label>
              <input name="city" defaultValue={listing.city} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">State</label>
              <input name="state" defaultValue={listing.state} className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Zip Code</label>
              <input name="zipCode" defaultValue={listing.zipCode ?? ''} className="border rounded w-full px-3 py-2" />
            </div>
            <div className="col-span-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button>
            </div>
          </form>
          {/* Confirmation message after save */}
          {typeof globalThis !== 'undefined' && (globalThis as any).__listingEditSuccess && (
            <div className="mt-4 text-green-600">Changes saved successfully.</div>
          )}
        </div>
      </div>
    </div>
  )
}
