import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const data = {
      email: body.email?.trim().toLowerCase(),
      password: body.password,
    }

    console.log('🔐 API Login attempt for:', data.email)

    const validated = loginSchema.parse(data)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (!user) {
      console.log('❌ User not found:', validated.email)
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }


    // Verify password
    const isValid = await verifyPassword(validated.password, user.password)
    if (!isValid) {
      console.log('❌ Password invalid')
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Block suspended/banned users
    if (user.isBanned) {
      console.log('❌ User is banned:', validated.email)
      return NextResponse.json(
        { success: false, error: 'Your account has been banned. Contact support.' },
        { status: 403 }
      )
    }
    if (user.isSuspended) {
      console.log('❌ User is suspended:', validated.email)
      return NextResponse.json(
        { success: false, error: 'Your account has been suspended. Contact support.' },
        { status: 403 }
      )
    }

    // Check if delivery partner is trying to use regular login
    if (user.role === 'DELIVERY_AGENT') {
      console.log('❌ Delivery partner tried to use regular login:', validated.email)
      return NextResponse.json(
        { success: false, error: 'Delivery partners should login at /partner/login', isDeliveryPartner: true },
        { status: 403 }
      )
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set cookie
    await setAuthCookie(token)

    console.log('✅ API Login successful for:', data.email)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    return response
  } catch (error: any) {
    console.error('❌ API Login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}
