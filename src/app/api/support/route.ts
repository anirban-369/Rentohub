import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { message, userEmail, reason } = await req.json();
    // Find all admin users
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length === 0) throw new Error('No admin users found');
    // Create a notification for each admin
    await Promise.all(admins.map(admin =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'BOOKING_REQUEST', // Use a generic type
          title: 'Support Request',
          message: `From: ${userEmail || 'anonymous'}\nReason: ${reason || 'Support'}\n${message}`,
        },
      })
    ));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit' }, { status: 500 });
  }
}
