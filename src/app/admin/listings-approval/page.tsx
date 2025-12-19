import { redirect } from 'next/navigation'

export default function AdminListingsApprovalPage() {
  // Feature removed: redirect to the main listings management page
  redirect('/admin/listings')
}
