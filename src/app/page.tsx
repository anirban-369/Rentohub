
"use client"
import React from 'react'

import Link from 'next/link'
import { searchListingsAction } from './actions/listings'
import ListingCard from '@/components/ListingCard'
import Navbar from '@/components/Navbar'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const SupportModal = dynamic(() => import('@/components/SupportModal'), { ssr: false })

export default function HomePage() {
  const [supportOpen, setSupportOpen] = useState(false)
  const [listings, setListings] = useState<any[]>([])

  // Fetch listings client-side for modal support
  React.useEffect(() => {
    searchListingsAction({}).then(result => {
      setListings(result.success ? result.listings : [])
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Rent Anything, <span className="text-primary-600">Anytime</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            From cameras to power tools, from bikes to books - rent what you need
            with secure delivery and verified listings
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/browse"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Browse Items
            </Link>
            <Link
              href="/dashboard/listings/create"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition"
            >
              List Your Items
            </Link>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-16">
          {[
            { name: 'Electronics', icon: '📱' },
            { name: 'Tools', icon: '🔧' },
            { name: 'Furniture', icon: '🛋️' },
            { name: 'Appliances', icon: '🔌' },
            { name: 'Cycles', icon: '🚲' },
            { name: 'Books', icon: '📚' },
            { name: 'Cameras', icon: '📷' },
            { name: 'Instruments', icon: '🎸' },
          ].map((category) => (
            <Link
              key={category.name}
              href={`/browse?category=${category.name}`}
              className="bg-white p-4 rounded-lg text-center hover:shadow-lg transition"
            >
              <div className="text-4xl mb-2">{category.icon}</div>
              <div className="text-sm font-medium text-gray-700">
                {category.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Recently Added
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.slice(0, 8).map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        {listings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No listings available yet. Be the first to list an item!
          </div>
        )}
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Why Choose RentoHub?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-bold mb-2">In-House Delivery</h3>
            <p className="text-gray-600">
              Track your rental in real-time with live map tracking.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Secure Transactions</h3>
            <p className="text-gray-600">
              Refundable deposits and escrow payments ensure safe transactions
              for everyone
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-2">Verified Listings</h3>
            <p className="text-gray-600">
              All lenders are KYC verified with photo verification at pickup and
              return
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          {/* Logo */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold italic">RentoHub</h2>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/browse" className="text-gray-400 hover:text-white transition">
                    Browse Items
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-gray-400 hover:text-white transition">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-white transition">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Lenders */}
            <div>
              <h3 className="text-lg font-semibold mb-4">For Lenders</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard/listings/create" className="text-gray-400 hover:text-white transition">
                    List Your Items
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Delivery Partners */}
            <div>
              <h3 className="text-lg font-semibold mb-4">For Delivery Partners</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/partner/register" className="text-gray-400 hover:text-white transition">
                    Partner With Us
                  </Link>
                </li>
                <li>
                  <Link href="/partner/login" className="text-gray-400 hover:text-white transition">
                    Partner Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Learn More */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Learn More</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-white transition w-full text-left"
                    onClick={() => setSupportOpen(true)}
                  >
                    Help & Support
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 pt-8">
            <p className="text-gray-500 text-sm">
              By continuing past this page, you agree to our Terms of Service, Privacy Policy and Content Policies. All trademarks are properties of their respective owners.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              © 2024-2025 RentoHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
