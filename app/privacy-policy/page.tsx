'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { useEffect, useState } from 'react'

const DEFAULT_PRIVACY_CONTENT = `Last updated: June 2024

Information We Collect
We collect information you provide directly to us, including name, phone number, email, address, and order details.

How We Use Your Information
• Process and fulfill your orders
• Send you order confirmations and updates
• Provide customer support
• Improve our products and services

Data Security
We take reasonable measures to protect your personal information from unauthorized access or alteration.

Contact Us
If you have questions about this privacy policy, please contact us at +91 9515019393.`

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState(DEFAULT_PRIVACY_CONTENT)
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
        if (settingsObj.privacyPolicyContent) {
          setContent(settingsObj.privacyPolicyContent)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
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