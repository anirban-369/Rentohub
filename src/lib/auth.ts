'use server'

import { cookies } from 'next/headers'
import { hashPassword, verifyPassword } from './bcrypt-utils'
import { generateToken, verifyToken, JWTPayload } from './jwt-utils'
import { prisma } from '@/lib/prisma'

const TOKEN_COOKIE_NAME = 'auth-token'

// Re-export types and functions
export type { JWTPayload }
export { hashPassword, verifyPassword, generateToken, verifyToken }

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE_NAME)
  return token?.value || null
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthCookie()
  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  // Check moderation flags from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { isSuspended: true, isBanned: true },
  })
  if (dbUser?.isBanned) {
    throw new Error('Account banned')
  }
  if (dbUser?.isSuspended) {
    throw new Error('Account suspended')
  }
  return user
}

export async function requireAdmin(): Promise<JWTPayload> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  return user
}
