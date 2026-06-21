'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { useEffect, useState } from 'react'

const DEFAULT_SHIPPING_CONTENT = `We deliver premium dry fruits, pickles, and ghee across India with care and hygiene.

Shipping Areas
We ship to all major cities and towns across India.

Delivery Time
Typically 2-5 business days depending on location. Metro cities: 1-3 days. Remote areas: 4-7 days.

Shipping Charges
Free shipping on orders above ₹999. Standard shipping charge of ₹50 applies for orders below ₹999.

Packaging
All products are carefully packed in hygienic, tamper-proof packaging to ensure freshness during transit.

Order Tracking
You will receive a tracking number via SMS and email once your order is dispatched.`

export default function ShippingPolicyPage() {
  const [content, setContent] = useState(DEFAULT_SHIPPING_CONTENT)
  const [settings, setSettings] = useState({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        const settingsObj = data.reduce((acc: any, s: any) => {
          acc[s.key] = s.value
          return acc
        }, {})
        setSettings(settingsObj)
        if (settingsObj.shippingPolicyContent) {
          setContent(settingsObj.shippingPolicyContent)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Shipping Policy</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-4 text-gray-600 whitespace-pre-line">
          {content}
        </div>
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone="9515019393" />
      <RewardsButton phone="9515019393" />
    </div>
  )
}