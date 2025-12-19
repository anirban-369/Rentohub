'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createBookingSchema } from '@/lib/validations'
import { calculateRentalCost } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

export async function createBookingAction(data: any) {
  try {
    const user = await requireAuth()

    const validated = createBookingSchema.parse(data)
    const paymentMethod = data.paymentMethod || 'CASH_ON_DELIVERY'

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { id: validated.listingId },
      include: { user: true },
    })

    if (!listing) {
      return { error: 'Listing not found' }
    }

    if (listing.userId === user.userId) {
      return { error: 'Cannot book your own listing' }
    }

    if (!listing.isAvailable || listing.isPaused) {
      return { error: 'Listing is not available' }
    }

    // Check date conflicts
    const startDate = new Date(validated.startDate)
    const endDate = new Date(validated.endDate)

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        listingId: validated.listingId,
        status: {
          in: ['ACCEPTED', 'IN_DELIVERY', 'ACTIVE'],
        },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    })

    if (conflictingBooking) {
      return { error: 'Listing is already booked for these dates' }
    }

    // Calculate costs
    const costs = calculateRentalCost(listing.pricePerDay, startDate, endDate)

    const totalAmount = costs.totalAmount + listing.deposit

    // Create booking with Cash on Delivery by default
    const booking = await prisma.booking.create({
      data: {
        listingId: validated.listingId,
        renterId: user.userId,
        lenderId: listing.userId,
        startDate,
        endDate,
        rentAmount: costs.rentAmount,
        depositAmount: listing.deposit,
        deliveryFee: costs.deliveryFee,
        totalAmount,
        platformFee: costs.platformFee,
        paymentMethod: paymentMethod,
      },
    })

    // Create notification for lender
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'BOOKING_REQUEST',
        title: 'New Booking Request',
        message: `${user.email} wants to rent your ${listing.title}`,
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      },
    })

    revalidatePath('/dashboard/bookings')
    return {
      success: true,
      bookingId: booking.id,
      paymentMethod: paymentMethod,
    }
  } catch (error: any) {
    console.error('Create booking error:', error)
    return { error: error.message || 'Failed to create booking' }
  }
}

export async function acceptBookingAction(bookingId: string) {
  try {
    const user = await requireAuth()

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true, renter: true },
    })

    if (!booking || booking.lenderId !== user.userId) {
      return { error: 'Unauthorized' }
    }

    if (booking.status !== 'REQUESTED') {
      return { error: 'Booking cannot be accepted' }
    }

    // Update booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    })

    // Create delivery job
    // Use renter's delivery address if available, otherwise fall back to listing address
    const deliveryAddress = booking.renter.deliveryAddress || booking.listing.address
    const deliveryCity = booking.renter.deliveryCity || booking.listing.city
    const deliveryLatitude = booking.renter.deliveryLatitude || booking.listing.latitude
    const deliveryLongitude = booking.renter.deliveryLongitude || booking.listing.longitude

    await prisma.deliveryJob.create({
      data: {
        bookingId: booking.id,
        pickupAddress: booking.listing.address,
        pickupLatitude: booking.listing.latitude,
        pickupLongitude: booking.listing.longitude,
        deliveryAddress: deliveryAddress,
        deliveryLatitude: deliveryLatitude,
        deliveryLongitude: deliveryLongitude,
      },
    })

    // Notify renter
    await prisma.notification.create({
      data: {
        userId: booking.renterId,
        type: 'BOOKING_ACCEPTED',
        title: 'Booking Accepted',
        message: `Your booking for ${booking.listing.title} has been accepted`,
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      },
    })

    revalidatePath('/dashboard/bookings')
    return { success: true }
  } catch (error: any) {
    console.error('Accept booking error:', error)
    return { error: error.message || 'Failed to accept booking' }
  }
}

export async function cancelBookingAction(bookingId: string, reason: string) {
  try {
    const user = await requireAuth()

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    })

    if (!booking) {
      return { error: 'Booking not found' }
    }

    if (booking.renterId !== user.userId && booking.lenderId !== user.userId) {
      return { error: 'Unauthorized' }
    }

    if (!['REQUESTED', 'ACCEPTED'].includes(booking.status)) {
      return { error: 'Booking cannot be cancelled' }
    }

    // Update booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        depositRefunded: false,
        refundAmount: 0,
      },
    })

    // Notify other party
    const notifyUserId =
      user.userId === booking.renterId ? booking.lenderId : booking.renterId

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: `A booking for ${booking.listing.title} has been cancelled`,
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      },
    })

    revalidatePath('/dashboard/bookings')
    return { success: true }
  } catch (error: any) {
    console.error('Cancel booking error:', error)
    return { error: error.message || 'Failed to cancel booking' }
  }
}

export async function getMyBookingsAction(type: 'renter' | 'lender') {
  try {
    const user = await requireAuth()

    const where =
      type === 'renter' ? { renterId: user.userId } : { lenderId: user.userId }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        deliveryJob: true,
      },
      orderBy: { requestedAt: 'desc' },
    })

    return { success: true, bookings }
  } catch (error: any) {
    console.error('Get bookings error:', error)
    return { error: error.message || 'Failed to fetch bookings' }
  }
}

export async function getBookingByIdAction(bookingId: string) {
  try {
    const user = await requireAuth()

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            user: true,
          },
        },
        renter: true,
        lender: true,
        deliveryJob: {
          include: {
            deliveryAgent: true,
          },
        },
        reviews: true,
      },
    })

    if (!booking) {
      return { error: 'Booking not found' }
    }

    if (
      booking.renterId !== user.userId &&
      booking.lenderId !== user.userId &&
      user.role !== 'ADMIN'
    ) {
      return { error: 'Unauthorized' }
    }

    return { success: true, booking }
  } catch (error: any) {
    console.error('Get booking error:', error)
    return { error: error.message || 'Failed to fetch booking' }
  }
}

export async function initiateReturnAction(bookingId: string) {
  try {
    const user = await requireAuth()

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: true,
        deliveryJob: true,
      },
    })

    if (!booking) {
      return { error: 'Booking not found' }
    }

    // Only renter can initiate return
    if (booking.renterId !== user.userId) {
      return { error: 'Unauthorized' }
    }

    // Can only return if booking is ACTIVE (item is currently with renter)
    if (booking.status !== 'ACTIVE') {
      return { error: 'Item cannot be returned at this stage' }
    }

    // Calculate early return refund (50% of remaining rental fees)
    const now = new Date()
    const endDate = new Date(booking.endDate)
    
    let earlyReturnRefund = 0
    
    // If returning before end date, calculate 50% refund of remaining duration
    if (now < endDate) {
      // Calculate remaining days/hours
      const totalDuration = endDate.getTime() - new Date(booking.startDate).getTime()
      const remainingDuration = endDate.getTime() - now.getTime()
      const percentageRemaining = remainingDuration / totalDuration
      
      // 50% of the remaining rental amount
      earlyReturnRefund = Math.round(booking.rentAmount * percentageRemaining * 0.5 * 100) / 100
    }

    // Update booking status and add return details
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'RETURN_IN_PROGRESS',
        returnInitiatedAt: new Date(),
        earlyReturnRefund: earlyReturnRefund,
      },
    })

    // Update delivery job status to RETURN_STARTED
    if (booking.deliveryJob) {
      await prisma.deliveryJob.update({
        where: { id: booking.deliveryJob.id },
        data: {
          status: 'RETURN_STARTED',
          returnStartedAt: new Date(),
        },
      })
    }

    // Notify lender that renter wants to return the item early
    await prisma.notification.create({
      data: {
        userId: booking.lenderId,
        type: 'DELIVERY_UPDATE',
        title: 'Early Return Requested',
        message: `Renter wants to return ${booking.listing.title} early. Refund amount: ₹${earlyReturnRefund}`,
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      },
    })

    revalidatePath('/dashboard/bookings')
    return {
      success: true,
      earlyReturnRefund: earlyReturnRefund,
      message: `Return initiated. You will receive ₹${earlyReturnRefund} refund for the remaining rental period.`,
    }
  } catch (error: any) {
    console.error('Initiate return error:', error)
    return { error: error.message || 'Failed to initiate return' }
  }
}
