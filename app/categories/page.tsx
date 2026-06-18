'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import RewardsButton from '@/components/RewardsButton'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  image?: string
  description?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCategories()
    fetchSettings()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const settingsObj = data.reduce((acc: Record<string, string>, s: {key: string, value: string}) => {
          acc[s.key] = s.value
          return acc
        }, {})
        setSettings(settingsObj)
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shop by Category</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition"
            >
              {category.image ? (
                <img src={category.image} alt={category.name} className="w-16 h-16 mx-auto rounded-full object-cover mb-3" />
              ) : (
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🥜</span>
                </div>
              )}
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
            </Link>
          ))}
        </div>
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber || '9515019393'} />
      <RewardsButton phone={settings.whatsappNumber || '9515019393'} />
    </div>
  )
}