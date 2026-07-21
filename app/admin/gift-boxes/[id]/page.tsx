'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  slug: string
  stockGrams: number
}

interface GiftBox {
  id: string
  name: string
  slug: string
  description?: string
  heroImage?: string
  thumbnail?: string
  gallery?: string
  fixedPrice: number
  originalPrice?: number
  discount?: number
  isActive: boolean
  isFeatured: boolean
  isTodayOffer: boolean
  sortOrder: number
  startDate?: Date
  endDate?: Date
  packagingCharge?: number
  deliveryCharge?: number
  gstRate?: number
  eligibleProducts: { id: string; productId: string; product: Product }[]
  rules: { id: string; ruleType: string; ruleValue: string; description?: string }[]
}

export default function GiftBoxEditPage() {
  const router = useRouter()
  const [giftBox, setGiftBox] = useState<GiftBox | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const slug = window.location.pathname.split('/').pop()
    if (slug) {
      fetchGiftBox(slug)
    }
    fetchProducts()
  }, [])

  const fetchGiftBox = async (slug: string) => {
    try {
      const res = await fetch(`/api/gift-boxes/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setGiftBox(data)
      }
    } catch (error) {
      console.error('Error fetching gift box:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) setProducts(await res.json())
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  if (!giftBox) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Gift box not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{giftBox.name}</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600"><strong>Slug:</strong> {giftBox.slug}</p>
                  <p className="text-sm text-gray-600"><strong>Fixed Price:</strong> Rs.{giftBox.fixedPrice}</p>
                  {giftBox.originalPrice && (
                    <p className="text-sm text-gray-600 line-through"><strong>Original:</strong> Rs.{giftBox.originalPrice}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600"><strong>Status:</strong> {giftBox.isActive ? 'Active' : 'Inactive'}</p>
                  <p className="text-sm text-gray-600"><strong>Featured:</strong> {giftBox.isFeatured ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligible Products</h3>
              <p className="text-sm text-gray-600 mb-3">{giftBox.eligibleProducts.length} products can be selected:</p>
              <div className="flex flex-wrap gap-2">
                {giftBox.eligibleProducts.map(ep => (
                  <span key={ep.productId} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    {ep.product.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => router.push('/admin/gift-boxes')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              ← Back to Gift Boxes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}