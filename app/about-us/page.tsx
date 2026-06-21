'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import { useEffect, useState } from 'react'

const DEFAULT_ABOUT_CONTENT = `MANI DRY FRUITS & GHEE STORES is a premium retailer specializing in organic dry fruits, 
artisanal pickles, and pure ghee. Established with a commitment to quality and 
authenticity, we source our products directly from trusted farmers.

Our Mission
To provide customers with the highest quality natural foods that promote health 
and wellness, while supporting sustainable farming practices.

Why Choose Us
• 100% Organic and Natural Products
• Direct from Farm to Table
• No Preservatives or Artificial Additives
• Fast and Safe Delivery Across India
• Hassle-free Returns and Exchanges`

export default function AboutUsPage() {
  const [aboutContent, setAboutContent] = useState(DEFAULT_ABOUT_CONTENT)
  const [settings, setSettings] = useState({ siteName: 'MANI DRY FRUITS & GHEE STORE' })

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
        if (settingsObj.aboutUsContent) {
          setAboutContent(settingsObj.aboutUsContent)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Us</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 whitespace-pre-line">{aboutContent}</p>
        </div>
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone="9515019393" />
      <RewardsButton phone="9515019393" />
    </div>
  )
}