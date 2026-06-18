'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={{}} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Us</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            MANI DRY FRUITS & GHEE STORES is a premium retailer specializing in organic dry fruits, 
            artisanal pickles, and pure ghee. Established with a commitment to quality and 
            authenticity, we source our products directly from trusted farmers.
          </p>
          <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
          <p className="text-gray-600 mb-4">
            To provide customers with the highest quality natural foods that promote health 
            and wellness, while supporting sustainable farming practices.
          </p>
          <h2 className="text-xl font-semibold mb-3">Why Choose Us</h2>
          <ul className="text-gray-600 space-y-2">
            <li>• 100% Organic and Natural Products</li>
            <li>• Direct from Farm to Table</li>
            <li>• No Preservatives or Artificial Additives</li>
            <li>• Fast and Safe Delivery Across India</li>
            <li>• Hassle-free Returns and Exchanges</li>
          </ul>
        </div>
      </main>
      <Footer settings={{}} />
      <WhatsAppButton phone="9515019393" />
      <RewardsButton phone="9515019393" />
    </div>
  )
}