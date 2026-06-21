'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { useEffect, useState } from 'react'

const DEFAULT_REFUND_CONTENT = `We want you to be completely satisfied with your purchase. If you are not satisfied for any reason, we offer a 30-day money-back guarantee.

Eligibility for Refund
• Products must be unused and in original packaging
• Request must be made within 30 days of delivery
• Products should not be expired or damaged

How to Request a Refund
Contact us at +91 9515019393 or email manidgs9393@gmail.com with your order details and reason for return.

Refund Processing
Refunds will be processed within 5-7 business days once we receive the returned product.

Return Shipping
We will provide a prepaid return shipping label for eligible returns.`

export default function RefundPolicyPage() {
  const [content, setContent] = useState(DEFAULT_REFUND_CONTENT)
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
        if (settingsObj.refundPolicyContent) {
          setContent(settingsObj.refundPolicyContent)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Refund Policy</h1>
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