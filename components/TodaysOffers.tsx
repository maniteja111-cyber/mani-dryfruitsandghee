'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/app/contexts/CartContext'

interface Product {
  id: string
  name: string
  slug: string
  pricePerKg: number | null
  stockGrams: number
  images: any
  category?: { name: string }
}

interface TodaysOffersProps {
  products: Product[]
}

export default function TodaysOffers({ products }: TodaysOffersProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({})
  const { addItem } = useCart()
  const VARIANTS = [
    { size: '125g', grams: 125 },
    { size: '250g', grams: 250 },
    { size: '500g', grams: 500 },
    { size: '1kg', grams: 1000 }
  ]

  function calculatePrice(basePricePerKg: number | null, grams: number): number {
    if (!basePricePerKg) return 0
    if (grams === 500) return Math.round(basePricePerKg * 0.56)
    if (grams === 250) return Math.round(basePricePerKg * 0.31)
    if (grams === 125) return Math.round(basePricePerKg * 0.19)
    return Math.round(basePricePerKg)
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">🔥 Today's Offers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => {
            let images: string[] = []
            if (Array.isArray(product.images)) {
              images = product.images.filter(Boolean)
            } else if (typeof product.images === 'string' && product.images.trim()) {
              try {
                let parsed = JSON.parse(product.images)
                if (typeof parsed === 'string') {
                  parsed = JSON.parse(parsed)
                }
                images = Array.isArray(parsed) ? parsed.filter(Boolean) : []
              } catch {}
            }
            images = images.map(img => {
              if (typeof img === 'string' && img.trim().startsWith('"')) {
                try { return JSON.parse(img) } catch { return img }
              }
              return img
            })
            const imageSrc = images[0] || ''

            const availableVariants = VARIANTS.filter(v => product.stockGrams >= v.grams)
            const selectedVariant = selectedVariants[product.id] || availableVariants[0] || VARIANTS[3]
            const price = calculatePrice(product.pricePerKg, selectedVariant.grams)
            const inStock = product.stockGrams > 0

return (
                  <div key={product.id} className="bg-white rounded-2xl shadow p-4">
                    {images.length > 0 && imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="h-40 w-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="h-40 w-full bg-gray-200 flex items-center justify-center rounded-xl">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    {!inStock && (
                      <div className="mt-2 text-center">
                        <span className="bg-red-500 text-white px-2 py-1 text-xs rounded">Out of Stock</span>
                      </div>
                    )}
                    <h3 className="font-bold mt-3">{product.name}</h3>

                    <select
                      value={selectedVariant?.size || ''}
                      onChange={(e) => {
                        const variant = availableVariants.find((v) => v.size === e.target.value) || availableVariants[0]
                        setSelectedVariants(prev => ({ ...prev, [product.id]: variant }))
                      }}
                      className="w-full mt-2 border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      {availableVariants.map((variant) => (
                        <option key={variant.size} value={variant.size}>
                          {variant.size} - ₹{calculatePrice(product.pricePerKg, variant.grams)}
                        </option>
                      ))}
                      {availableVariants.length === 0 && (
                        <option value="">Out of Stock</option>
                      )}
                    </select>

                    <div className="flex items-center space-x-2 mt-1">
                      <p className="font-bold text-xl">₹{price}</p>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => addItem({
                          id: product.id + `-${selectedVariant.size}`,
                          productId: product.id,
                          name: `${product.name} (${selectedVariant.size})`,
                          slug: product.slug,
                          price,
                          images: images,
                          selectedVariant
                        })}
                        className={`flex-1 bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-red-700 ${!inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!inStock}
                      >
                        Add to Cart
                      </button>
                      <a
                        className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm text-center hover:bg-red-600"
                        href={`/products/${product.slug}`}
                      >
                        View
                      </a>
                    </div>
                  </div>
                )
            })}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/products"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}