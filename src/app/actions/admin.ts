"use server"
// Admin KYC Reset Action
export async function adminResetKYCAction(userId: string) {
  try {
    const admin = await requireAdmin()
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { kyc: true } })
    if (!user?.kyc) return { error: 'No KYC found' }
    await prisma.kYC.update({
      where: { id: user.kyc.id },
      data: { status: 'PENDING', reviewedAt: null, reviewedBy: null, rejectionReason: null },
    })
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'RESET_KYC',
        targetType: 'KYC',
        targetId: user.kyc.id,
      },
    })
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to reset KYC' }
  }
}
// Admin Booking Management Actions
export async function adminCancelBookingAction(bookingId: string, reason?: string) {
  try {
    const admin = await requireAdmin()
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    })
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'CANCEL_BOOKING',
        targetType: 'BOOKING',
        targetId: bookingId,
        metadata: JSON.stringify({ reason }),
      },
    })
    await prisma.notification.create({
      data: {
        userId: booking.renterId,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: reason ? `Booking cancelled: ${reason}` : 'Booking cancelled by admin.',
        relatedEntityId: bookingId,
        relatedEntityType: 'booking',
      },
    })
    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to cancel booking' }
  }
}

export async function adminCompleteBookingAction(bookingId: string) {
  try {
    const admin = await requireAdmin()
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    })
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'COMPLETE_BOOKING',
        targetType: 'BOOKING',
        targetId: bookingId,
      },
    })
    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to complete booking' }
  }
}

export async function adminRefundBookingAction(bookingId: string, amount: number, reason?: string) {
  try {
    const admin = await requireAdmin()
    await prisma.booking.update({
      where: { id: bookingId },
      data: { refundAmount: amount },
    })
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'REFUND_BOOKING',
        targetType: 'BOOKING',
        targetId: bookingId,
        metadata: JSON.stringify({ amount, reason }),
      },
    })
    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to refund booking' }
  }
}

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

// User Management
export async function getAllUsersAction(params?: {
  page?: number
  pageSize?: number
  query?: string
}) {
  try {
    await requireAdmin()

    const page = Math.max(1, params?.page || 1)
    const take = Math.max(1, Math.min(50, params?.pageSize || 20))
    const skip = (page - 1) * take
    const query = params?.query?.trim()

    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : undefined

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          kyc: true,
          _count: {
            select: {
              listings: true,
              bookingsAsRenter: true,
              bookingsAsLender: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ])

    return { success: true, users, total, page, pageSize: take }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch users' }
  }
}

export async function adminUpdateUserRoleAction(
  userId: string,
  role: 'USER' | 'ADMIN' | 'DELIVERY_AGENT'
) {
  try {
    const admin = await requireAdmin()

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'UPDATE_USER_ROLE',
        targetType: 'USER',
        targetId: userId,
        metadata: JSON.stringify({ role }),
      },
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to update user role' }
  }
}

export async function adminSuspendUserAction(userId: string, reason?: string) {
  try {
    const admin = await requireAdmin()
    await prisma.user.update({ where: { id: userId }, data: ({ isSuspended: true, suspensionReason: reason } as any) })
    await prisma.adminAction.create({
      data: { adminId: admin.userId, action: 'SUSPEND_USER', targetType: 'USER', targetId: userId, reason }
    })
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to suspend user' }
  }
}

export async function adminUnsuspendUserAction(userId: string) {
  try {
    const admin = await requireAdmin()
    await prisma.user.update({ where: { id: userId }, data: ({ isSuspended: false, suspensionReason: null } as any) })
    await prisma.adminAction.create({
      data: { adminId: admin.userId, action: 'UNSUSPEND_USER', targetType: 'USER', targetId: userId }
    })
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to unsuspend user' }
  }
}

export async function adminBanUserAction(userId: string, reason?: string) {
  try {
    const admin = await requireAdmin()
    await prisma.user.update({ where: { id: userId }, data: ({ isBanned: true, bannedReason: reason } as any) })
    await prisma.adminAction.create({
      data: { adminId: admin.userId, action: 'BAN_USER', targetType: 'USER', targetId: userId, reason }
    })
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to ban user' }
  }
}

export async function adminUnbanUserAction(userId: string) {
  try {
    const admin = await requireAdmin()
    await prisma.user.update({ where: { id: userId }, data: ({ isBanned: false, bannedReason: null } as any) })
    await prisma.adminAction.create({
      data: { adminId: admin.userId, action: 'UNBAN_USER', targetType: 'USER', targetId: userId }
    })
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to unban user' }
  }
}

export async function adminUpdateUserProfileAction(userId: string, data: any) {
  try {
    await requireAdmin()
    const allowed = ['name', 'phone', 'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZipCode']
    const updates: any = {}
    for (const key of allowed) {
      if (key in data) updates[key] = data[key]
    }
    const user = await prisma.user.update({ where: { id: userId }, data: updates })
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    return { success: true, user }
  } catch (error: any) {
    return { error: error.message || 'Failed to update user profile' }
  }
}

export async function approveKYCAction(kycId: string) {
  try {
    const admin = await requireAdmin()

    await prisma.kYC.update({
      where: { id: kycId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: admin.userId,
      },
    })

    // Get user and notify
    const kyc = await prisma.kYC.findUnique({
      where: { id: kycId },
    })

    if (kyc) {
      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          type: 'KYC_STATUS',
          title: 'KYC Approved',
          message: 'Your KYC has been approved. You can now list items.',
        },
      })
    }

    revalidatePath('/admin/kyc')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to approve KYC' }
  }
}

export async function rejectKYCAction(kycId: string, reason: string) {
  try {
    const admin = await requireAdmin()

    await prisma.kYC.update({
      where: { id: kycId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: admin.userId,
        rejectionReason: reason,
      },
    })

    // Get user and notify
    const kyc = await prisma.kYC.findUnique({
      where: { id: kycId },
    })

    if (kyc) {
      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          type: 'KYC_STATUS',
          title: 'KYC Rejected',
          message: `Your KYC was rejected. Reason: ${reason}`,
        },
      })
    }

    revalidatePath('/admin/kyc')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to reject KYC' }
  }
}

// Listing Management
export async function getAllListingsAction(params?: {
  page?: number
  pageSize?: number
  query?: string
  city?: string
  status?: 'available' | 'paused' | 'unavailable'
}) {
  try {
    await requireAdmin()

    const page = Math.max(1, params?.page || 1)
    const take = Math.max(1, Math.min(50, params?.pageSize || 20))
    const skip = (page - 1) * take
    const query = params?.query?.trim()

    const where: any = {}
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ]
    }
    if (params?.city) {
      where.city = { contains: params.city, mode: 'insensitive' }
    }
    if (params?.status === 'available') {
      where.isAvailable = true
      where.isPaused = false
    } else if (params?.status === 'paused') {
      where.isPaused = true
    } else if (params?.status === 'unavailable') {
      where.isAvailable = false
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.listing.count({ where }),
    ])

    return { success: true, listings, total, page, pageSize: take }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch listings' }
  }
}

export async function deleteListingAdminAction(listingId: string) {
  try {
    const admin = await requireAdmin()

    await prisma.listing.delete({
      where: { id: listingId },
    })

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'DELETE_LISTING',
        targetType: 'LISTING',
        targetId: listingId,
      },
    })

    revalidatePath('/admin/listings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete listing' }
  }
}

export async function toggleListingPauseAdminAction(listingId: string) {
  try {
    const admin = await requireAdmin()

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) {
      return { error: 'Listing not found' }
    }

    const newPaused = !listing.isPaused
    await prisma.listing.update({
      where: { id: listingId },
      data: { isPaused: newPaused },
    })

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: newPaused ? 'PAUSE_LISTING' : 'RESUME_LISTING',
        targetType: 'LISTING',
        targetId: listingId,
      },
    })

    revalidatePath('/admin/listings')
    return { success: true, isPaused: newPaused }
  } catch (error: any) {
    return { error: error.message || 'Failed to toggle listing pause' }
  }
}

export async function adminUpdateListingAction(listingId: string, data: any) {
  try {
    await requireAdmin()

    // Validate using existing schema
    let validated
    try {
      const { updateListingSchema } = await import('@/lib/validations')
      validated = updateListingSchema.parse(data)
    } catch (err: any) {
      return { error: err.errors?.[0]?.message || 'Validation failed' }
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...validated,
        images: data.images ?? undefined,
      },
    })

    revalidatePath('/admin/listings')
    revalidatePath(`/admin/listings/${listingId}`)
    revalidatePath(`/listings/${listingId}`)
    return { success: true, listing: updated }
  } catch (error: any) {
    return { error: error.message || 'Failed to update listing' }
  }
}

// Booking Management
export async function getAllBookingsAction(params?: {
  page?: number
  pageSize?: number
  status?: string
  query?: string
}) {
  try {
    await requireAdmin()

    const page = Math.max(1, params?.page || 1)
    const take = Math.max(1, Math.min(50, params?.pageSize || 20))
    const skip = (page - 1) * take
    const query = params?.query?.trim()

    const where: any = {}
    if (params?.status) {
      where.status = params.status as any
    }
    if (query) {
      where.OR = [
        { listing: { title: { contains: query, mode: 'insensitive' } } },
        { renter: { name: { contains: query, mode: 'insensitive' } } },
        { lender: { name: { contains: query, mode: 'insensitive' } } },
      ]
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          listing: true,
          renter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          deliveryJob: true,
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take,
      }),
      prisma.booking.count({ where }),
    ])

    return { success: true, bookings, total, page, pageSize: take }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch bookings' }
  }
}

// Dispute Management
export async function getAllDisputesAction() {
  try {
    await requireAdmin()

    const disputes = await prisma.dispute.findMany({
      include: {
        booking: {
          include: {
            listing: true,
            renter: true,
            lender: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, disputes }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch disputes' }
  }
}

export async function resolveDisputeAction(
  disputeId: string,
  resolution: string,
  depositRefundAmount: number
) {
  try {
    const admin = await requireAdmin()

    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
        depositRefundAmount,
        resolvedBy: admin.userId,
        resolvedAt: new Date(),
      },
      include: { booking: true },
    })

    // Update booking
    await prisma.booking.update({
      where: { id: dispute.bookingId },
      data: {
        status: 'COMPLETED',
        refundAmount: depositRefundAmount,
      },
    })

    // Notify both parties
    await prisma.notification.create({
      data: {
        userId: dispute.reportedBy,
        type: 'DISPUTE_OPENED',
        title: 'Dispute Resolved',
        message: `Your dispute has been resolved: ${resolution}`,
        relatedEntityId: dispute.bookingId,
        relatedEntityType: 'booking',
      },
    })

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'RESOLVE_DISPUTE',
        targetType: 'DISPUTE',
        targetId: disputeId,
        metadata: JSON.stringify({ resolution, depositRefundAmount }),
      },
    })

    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to resolve dispute' }
  }
}

// Analytics
export async function getAdminAnalyticsAction() {
  try {
    await requireAdmin()

    const [
      totalUsers,
      totalListings,
      totalBookings,
      activeBookings,
      pendingKYCs,
      openDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'ACTIVE' } }),
      prisma.kYC.count({ where: { status: 'PENDING' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
    ])

    return {
      success: true,
      analytics: {
        totalUsers,
        totalListings,
        totalBookings,
        activeBookings,
        pendingKYCs,
        openDisputes,
      },
    }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch analytics' }
  }
}

// Listing Management
export async function approveListing(listingId: string, reason?: string) {
  try {
    const admin = await requireAdmin()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return { error: 'Listing not found' }
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        isAvailable: true,
      },
    })

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'APPROVE_LISTING',
        targetType: 'LISTING',
        targetId: listingId,
        reason,
      },
    })

    // Create notification for lender
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'BOOKING_ACCEPTED',
        title: 'Listing Approved',
        message: `Your listing "${listing.title}" has been approved and is now visible to renters.`,
        relatedEntityId: listingId,
        relatedEntityType: 'LISTING',
      },
    })

    revalidatePath('/admin/listings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to approve listing' }
  }
}

export async function rejectListing(listingId: string, reason: string) {
  try {
    const admin = await requireAdmin()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return { error: 'Listing not found' }
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        isAvailable: false,
        isPaused: true,
      },
    })

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'REJECT_LISTING',
        targetType: 'LISTING',
        targetId: listingId,
        reason,
      },
    })

    // Create notification for lender
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Listing Rejected',
        message: `Your listing "${listing.title}" has been rejected. Reason: ${reason}`,
        relatedEntityId: listingId,
        relatedEntityType: 'LISTING',
      },
    })

    revalidatePath('/admin/listings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to reject listing' }
  }
}

export async function getListingsForApprovalAction() {
  try {
    await requireAdmin()

    const listings = await prisma.listing.findMany({
      where: {
        isAvailable: false,
        isPaused: false,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, listings }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch listings for approval' }
  }
}

export async function getAllListingsForAdminAction() {
  try {
    await requireAdmin()

    const listings = await prisma.listing.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return { success: true, listings }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch listings' }
  }
}

