'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { updateDeliveryStatusSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function updateDeliveryStatusAction(
  deliveryJobId: string,
  data: any
) {
  try {
    const user = await requireAuth()

    // Check if user is delivery agent or admin
    const deliveryJob = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJobId },
      include: { booking: true },
    })

    if (!deliveryJob) {
      return { error: 'Delivery job not found' }
    }

    if (
      user.role !== 'DELIVERY_AGENT' &&
      user.role !== 'ADMIN' &&
      deliveryJob.deliveryAgentId !== user.userId
    ) {
      return { error: 'Unauthorized' }
    }

    const validated = updateDeliveryStatusSchema.parse(data)

    // Update delivery job
    const updateData: any = {
      status: validated.status,
    }

    // Update timestamps based on status
    switch (validated.status) {
      case 'PICKUP_STARTED':
        updateData.pickupStartedAt = new Date()
        break
      case 'PICKED':
        updateData.pickedAt = new Date()
        break
      case 'OUT_FOR_DELIVERY':
        updateData.outForDeliveryAt = new Date()
        break
      case 'DELIVERED':
        updateData.deliveredAt = new Date()
        // Update booking status
        await prisma.booking.update({
          where: { id: deliveryJob.bookingId },
          data: { status: 'ACTIVE' },
        })
        break
      case 'RETURN_STARTED':
        updateData.returnStartedAt = new Date()
        break
      case 'RETURNED':
        updateData.returnedAt = new Date()
        // Update booking status
        await prisma.booking.update({
          where: { id: deliveryJob.bookingId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            depositRefunded: true,
            refundAmount: deliveryJob.booking.depositAmount || 0,
          },
        })
        break
    }

    // Update GPS location if provided
    if (validated.latitude && validated.longitude) {
      updateData.currentLatitude = validated.latitude
      updateData.currentLongitude = validated.longitude
      updateData.lastLocationUpdate = new Date()
    }

    await prisma.deliveryJob.update({
      where: { id: deliveryJobId },
      data: updateData,
    })

    // Create notification
    const booking = deliveryJob.booking
    await prisma.notification.create({
      data: {
        userId: booking.renterId,
        type: 'DELIVERY_UPDATE',
        title: 'Delivery Update',
        message: `Delivery status updated to ${validated.status}`,
        relatedEntityId: deliveryJob.bookingId,
        relatedEntityType: 'booking',
      },
    })

    revalidatePath('/dashboard/bookings')
    return { success: true }
  } catch (error: any) {
    console.error('Update delivery status error:', error)
    return { error: error.message || 'Failed to update delivery status' }
  }
}

export async function uploadDeliveryPhotoAction(
  deliveryJobId: string,
  photoType: 'pickup' | 'delivery' | 'return',
  photoUrl: string
) {
  try {
    const user = await requireAuth()

    const deliveryJob = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJobId },
    })

    if (!deliveryJob) {
      return { error: 'Delivery job not found' }
    }

    if (
      user.role !== 'DELIVERY_AGENT' &&
      user.role !== 'ADMIN' &&
      deliveryJob.deliveryAgentId !== user.userId
    ) {
      return { error: 'Unauthorized' }
    }

    // Update photo URL based on type
    const updateData: any = {}
    if (photoType === 'pickup') {
      updateData.pickupPhotoUrl = photoUrl
    } else if (photoType === 'delivery') {
      updateData.deliveryPhotoUrl = photoUrl
    } else if (photoType === 'return') {
      updateData.returnPhotoUrl = photoUrl
    }

    await prisma.deliveryJob.update({
      where: { id: deliveryJobId },
      data: updateData,
    })

    revalidatePath('/dashboard/bookings')
    return { success: true }
  } catch (error: any) {
    console.error('Upload delivery photo error:', error)
    return { error: error.message || 'Failed to upload photo' }
  }
}

export async function getDeliveryJobAction(deliveryJobId: string) {
  try {
    const user = await requireAuth()

    const deliveryJob = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJobId },
      include: {
        booking: {
          include: {
            listing: true,
            renter: true,
            lender: true,
          },
        },
        deliveryAgent: true,
      },
    })

    if (!deliveryJob) {
      return { error: 'Delivery job not found' }
    }

    // Check authorization
    if (
      user.role !== 'ADMIN' &&
      deliveryJob.deliveryAgentId !== user.userId &&
      deliveryJob.booking.renterId !== user.userId &&
      deliveryJob.booking.lenderId !== user.userId
    ) {
      return { error: 'Unauthorized' }
    }

    return { success: true, deliveryJob }
  } catch (error: any) {
    console.error('Get delivery job error:', error)
    return { error: error.message || 'Failed to fetch delivery job' }
  }
}

export async function getMyDeliveryJobsAction() {
  try {
    const user = await requireAuth()

    if (user.role !== 'DELIVERY_AGENT') {
      return { error: 'Only delivery agents can access this' }
    }

    const deliveryJobs = await prisma.deliveryJob.findMany({
      where: {
        deliveryAgentId: user.userId,
      },
      include: {
        booking: {
          include: {
            listing: true,
            renter: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, deliveryJobs }
  } catch (error: any) {
    console.error('Get delivery jobs error:', error)
    return { error: error.message || 'Failed to fetch delivery jobs' }
  }
}

// Delivery Agent Assignment (Admin)
export async function getDeliveryAgentsAction() {
  try {
    await requireAdmin()
    
    const agents = await prisma.user.findMany({
      where: {
        role: 'DELIVERY_AGENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        _count: {
          select: {
            deliveryJobs: true,
          },
        },
      },
    })

    return { success: true, agents }
  } catch (error: any) {
    console.error('Get delivery agents error:', error)
    return { error: error.message || 'Failed to fetch agents' }
  }
}

export async function getUnassignedDeliveriesAction() {
  try {
    await requireAdmin()
    
    const deliveries = await prisma.deliveryJob.findMany({
      where: {
        deliveryAgentId: null,
      },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                title: true,
                address: true,
              },
            },
            renter: {
              select: {
                name: true,
                phone: true,
              },
            },
            lender: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, deliveries }
  } catch (error: any) {
    console.error('Get unassigned deliveries error:', error)
    return { error: error.message || 'Failed to fetch deliveries' }
  }
}

export async function assignDeliveryAgentAction(deliveryJobId: string, agentId: string) {
  try {
    await requireAdmin()
    
    const delivery = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJobId },
      include: { booking: true },
    })

    if (!delivery) {
      return { error: 'Delivery job not found' }
    }

    // Update delivery job with agent
    await prisma.deliveryJob.update({
      where: { id: deliveryJobId },
      data: {
        deliveryAgentId: agentId,
        status: 'ASSIGNED',
      },
    })

    // Create notification for agent
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    })

    if (agent) {
      await prisma.notification.create({
        data: {
          userId: agentId,
          type: 'DELIVERY_UPDATE',
          title: 'New Delivery Assigned',
          message: `You have been assigned a new delivery job for booking #${delivery.bookingId.slice(0, 8)}`,
          relatedEntityId: deliveryJobId,
          relatedEntityType: 'DELIVERY',
        },
      })
    }

    revalidatePath('/admin/delivery-assignments')
    return { success: true }
  } catch (error: any) {
    console.error('Assign delivery agent error:', error)
    return { error: error.message || 'Failed to assign agent' }
  }
}

export async function unassignDeliveryAgentAction(deliveryJobId: string) {
  try {
    await requireAdmin()
    
    await prisma.deliveryJob.update({
      where: { id: deliveryJobId },
      data: {
        deliveryAgentId: null,
      },
    })

    revalidatePath('/admin/delivery-assignments')
    return { success: true }
  } catch (error: any) {
    console.error('Unassign delivery agent error:', error)
    return { error: error.message || 'Failed to unassign agent' }
  }
}

