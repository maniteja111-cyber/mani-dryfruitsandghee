'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/app/contexts/CartContext'
import { getUnitSymbol } from '@/app/services/pricing.service'
import { isValidImageUrl } from '@/lib/image-utils'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface NormalizedVariant {
  id: string
  label: string
  size: string
  price: number
  unitType: string
  grams: number
  sizeValue: string
}

interface Product {
  id: string
  name: string
  slug: string
  pricePerKg: number | null
  stockGrams: number
  images: any
  category?: { name: string }
  extension?: {
    stockQuantity: number | null
    basePrice?: number
    masterUnit?: { type: string | null }
  } | null
  variantPrices?: NormalizedVariant[]
  productType: string | null
  unitSymbol: string
}

interface FeaturedProductsProps {
  products: Product[]
  title?: string
  settings: Record<string, string>
}

export default function FeaturedProducts({ products, title = "⭐ Featured Products", settings }: FeaturedProductsProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({})
  const [wishlist, setWishlist] = useState<string[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const { addItem, items } = useCart()

  useEffect(() => {
    const saved = localStorage.getItem('wishlist')
    if (saved) setWishlist(JSON.parse(saved))
  }, [])

  const toggleWishlist = async (productId: string) => {
    const userStr = localStorage.getItem('user')
    let newWishlist = [...wishlist]

    if (wishlist.includes(productId)) {
      newWishlist = newWishlist.filter(id => id !== productId)
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          await fetch('/api/wishlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: user.phone, productId })
          })
        } catch {}
      }
    } else {
      newWishlist.push(productId)
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: user.phone, productId })
          })
        } catch {}
      }
    }

    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <>
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">{title}</h2>
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
              const validImages = images.filter(img => typeof img === 'string' && isValidImageUrl(img))
              const imageSrc = validImages[0] || '/placeholder.svg'

              const availableVariants = product.variantPrices || []
              const selectedVariant = selectedVariants[product.id] || availableVariants[0] || null
              const price = selectedVariant?.price ?? product.pricePerKg ?? 0
              const productType = selectedVariant?.unitType || product.productType
              const hasStock = product.stockGrams > 0 || (product.extension?.stockQuantity ?? 0) > 0
              const hasPricing = !!(product.extension?.basePrice || product.pricePerKg)
              const inStock = hasStock || availableVariants.length > 0 || hasPricing

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-all p-4 group">
                  <Link href={`/products/${product.slug}`} className="relative block">
                    {validImages.length > 0 ? (
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="h-40 w-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform"
                      />
                    ) : (
                      <div className="h-40 w-full bg-gray-200 flex items-center justify-center rounded-xl">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.preventDefault(); toggleWishlist(product.id) }}
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow hover:bg-white transition"
                    >
                      <span className="text-lg" style={{ color: wishlist.includes(product.id) ? (settings.themeColor || '#ef4444') : '#9ca3af' }}>
                        {wishlist.includes(product.id) ? '♥' : '♡'}
                      </span>
                    </button>
                  </Link>
                  {!inStock && (
                    <div className="mt-2 text-center">
                      <span className="bg-red-500 text-white px-2 py-1 text-xs rounded">Out of Stock</span>
                    </div>
                  )}
                  <Link href={`/products/${product.slug}`} className="block mt-3">
                    <h3 className="font-bold hover:text-yellow-600 cursor-pointer">{product.name}</h3>
                  </Link>

                  {availableVariants.length > 0 ? (
                    <select
                      value={selectedVariant?.id || ''}
                      onChange={(e) => {
                        const variant = availableVariants.find((v) => v.id === e.target.value)
                        if (variant) setSelectedVariants(prev => ({ ...prev, [product.id]: variant }))
                      }}
                      className="w-full mt-2 border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      {availableVariants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.size} - ₹{variant.price}
                        </option>
                      ))}
                      {availableVariants.length === 0 && (
                        <option value="">Out of Stock</option>
                      )}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">No variants</p>
                  )}

                  <div className="flex items-center space-x-2 mt-1">
                    <p className="font-bold text-xl">₹{price}</p>
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => {
                        const otherVariantsInCart = items.filter(i => i.productId === product.id).reduce((sum, i) => {
                          if (i.selectedVariant?.unitType === 'weight') {
                            return sum + (i.selectedVariant?.grams || 1000) * i.quantity
                          }
                          return sum + i.quantity
                        }, 0)
                        
                        const productType = selectedVariant?.unitType || product.productType
                        const stockSource = productType === 'weight' ? product.stockGrams : (product.extension?.stockQuantity || 0)
                        const available = Math.max(0, stockSource - otherVariantsInCart)
                        const selectedGrams = selectedVariant?.grams || 1000
                        const maxQuantity = productType === 'weight' 
                          ? Math.max(0, Math.floor(available / selectedGrams))
                          : available
                        
                        if (maxQuantity <= 0) {
                          showToast(`${product.name} - Not enough stock!`, 'error')
                          return
                        }
                        
                        addItem({
                          id: product.id,
                          productId: product.id,
                          name: product.name,
                          slug: product.slug,
                          price,
                          images,
                          selectedVariant: selectedVariant ? {
                            id: selectedVariant.id,
                            size: selectedVariant.size,
                            label: selectedVariant.label,
                            grams: selectedVariant.grams,
                            unitType: selectedVariant.unitType
                          } : undefined,
                          stock: productType === 'weight' ? product.stockGrams : (product.extension?.stockQuantity || 0),
                          quantity: 1
                        })
                        showToast(`${product.name} added to cart!`, 'success')
                      }}
                      style={{ backgroundColor: settings.themeColor || '#10b981' }}
                      className={`flex-1 text-white px-3 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90 ${!inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!inStock}
                    >
                      Add to Cart
                    </button>
                    <a
                      style={{ backgroundColor: settings.themeColor || '#FFD60A' }}
                      className="flex-1 text-black px-3 py-2.5 rounded-xl font-semibold text-sm text-center transition hover:opacity-90"
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
            className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>

    {/* Toast Notifications */}
    {toasts.length > 0 && (
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 min-w-[200px] justify-center ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={toast.type === 'error' ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'} />
            </svg>
            {toast.message}
          </div>
        ))}
      </div>
    )}
    </>
  )
}