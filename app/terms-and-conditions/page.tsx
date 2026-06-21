'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { useEffect, useState } from 'react'

const DEFAULT_TERMS_CONTENT = `Last updated: June 2024

Acceptance of Terms
By accessing or using our website, you agree to be bound by these Terms and Conditions.

Product Information
We strive to provide accurate product information. However, colors and images may vary slightly due to screen settings.

Orders
All orders are subject to our acceptance. We reserve the right to refuse or cancel any order for any reason.

Payment
All payments are processed securely. We accept all major payment methods including UPI, cards, and COD.

Limitation of Liability
Our liability is limited to the purchase price of the product. We are not liable for indirect damages.

Governing Law
These terms are governed by the laws of India.`

export default function TermsAndConditionsPage() {
  const [content, setContent] = useState(DEFAULT_TERMS_CONTENT)
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
        if (settingsObj.termsAndConditionsContent) {
          setContent(settingsObj.termsAndConditionsContent)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms and Conditions</h1>
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