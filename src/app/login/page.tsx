'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
const SupportModal = dynamic(() => import('@/components/SupportModal'), { ssr: false })
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportReason, setSupportReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      console.log('🔐 Attempting login for:', email)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: include cookies
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ Login successful, redirecting...')
        // Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 500))
        // Use hard refresh to ensure middleware runs
        window.location.href = '/dashboard'
      } else if (result.isDeliveryPartner) {
        // Redirect delivery partners to partner login
        setError('This account is registered as a Delivery Partner. Redirecting to partner login...')
        setTimeout(() => {
          window.location.href = '/partner/login'
        }, 2000)
      } else {
        setError(result.error || 'Login failed')
        setLoading(false)
        if (result.error && (result.error.includes('suspend') || result.error.includes('banned'))) {
          setSupportReason(result.error)
          setSupportOpen(true)
        }
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError('An error occurred during login. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Bar */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            RentoHub
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/browse" className="text-gray-600 hover:text-primary-600 transition">
              Browse
            </Link>
            <Link href="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-72px)]">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600 mb-8">Login to your RentoHub account</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} reason={supportReason} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
              placeholder="••••••••"
            />
            <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 mt-1 inline-block">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-600 font-medium">
            Sign Up
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
