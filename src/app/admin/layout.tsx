import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import AdminNav from '@/components/AdminNav'
import AdminHeader from '@/components/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        {/* Sidebar */}
        <AdminNav />
        
        {/* Main Content */}
        <main className="flex-1 ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  )
}
