'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/app/contexts/CartContext'
import Link from 'next/link'
import Image from 'next/image'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface Product {
  id: string
  name: string
  slug: string
  pricePerKg: number | null
  stockGrams: number
  images: string[] | any
  category: { name: string }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductListProps {
  initialProducts: Product[]
  categories: Category[]
  searchParams: { [key: string]: string | string[] | undefined }
  settings: Record<string, string>
}

export function ProductList({ initialProducts, categories, searchParams, settings }: ProductListProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({})
  const [wishlist, setWishlist] = useState<string[]>([])
  const { addItem, items } = useCart()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const [toasts, setToasts] = useState<Toast[]>([])

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
    console.log('PRODUCT_LIST TOAST - called with:', message)
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const handleAddToCart = (item: any) => {
    console.log('PRODUCT_LIST ADD_TO_CART - clicked')
    
    const otherVariantsInCart = items.filter(i => i.productId === item.productId).reduce((sum, i) => sum + (i.selectedVariant?.grams || 1000) * i.quantity, 0)
    const availableGrams = Math.max(0, item.stock - otherVariantsInCart)
    const maxQuantity = Math.max(0, Math.floor(availableGrams / item.selectedVariant.grams))
    
    if (maxQuantity <= 0) {
      showToast(`${item.name} - Not enough stock!`, 'error')
      return
    }
    
    addItem({ ...item, quantity: 1 })
    showToast(`${item.name} added to cart!`, 'success')
  }

  const updateFilters = (newParams: Record<string, string>) => {
    const url = new URL(window.location.href)
    Object.keys(newParams).forEach(key => {
      if (newParams[key]) {
        url.searchParams.set(key, newParams[key])
      } else {
        url.searchParams.delete(key)
      }
    })
    router.push(url.pathname + url.search)
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const res = await fetch(`/api/products?${searchParams}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [searchParams])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={params.get('category') || ''}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={`${params.get('sort') || 'createdAt'}-${params.get('order') || 'desc'}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-')
                updateFilters({ sort, order })
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              defaultValue={params.get('search') || ''}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  updateFilters({ search: (e.target as HTMLInputElement).value })
                }
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="lg:col-span-3">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  if (Array.isArray(parsed)) {
                    images = parsed.filter(Boolean)
                  } else if (typeof parsed === 'string') {
                    images = [parsed]
                  }
                } catch {}
              }

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

              const availableVariants = VARIANTS.filter(v => product.stockGrams >= v.grams)
              const selectedVariant = selectedVariants[product.id] || availableVariants[0] || VARIANTS[3]
              const price = calculatePrice(product.pricePerKg, selectedVariant.grams)
              const inStock = product.stockGrams > 0

              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm p-3">
                  <Link href={`/products/${product.slug}`} className="relative block">
                    {images && images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={product.name}
                        className="h-32 w-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-32 w-full bg-gray-200 flex items-center justify-center rounded-md">
                        <span className="text-gray-500 text-xs">No Image</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.preventDefault(); toggleWishlist(product.id) }}
                      className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow hover:bg-white"
                    >
                      <span className="text-sm" style={{ color: wishlist.includes(product.id) ? (settings.themeColor || '#ef4444') : '#9ca3af' }}>
                        {wishlist.includes(product.id) ? '♥' : '♡'}
                      </span>
                    </button>
                  </Link>
                  {!inStock && (
                    <div className="mt-1 text-center">
                      <span className="bg-red-500 text-white px-1 py-0.5 text-xs rounded">Out of Stock</span>
                    </div>
                  )}
                  <select
                    value={selectedVariant.size}
                    onChange={(e) => {
                      const variant = availableVariants.find((v) => v.size === e.target.value) || availableVariants[0]
                      setSelectedVariants(prev => ({ ...prev, [product.id]: variant }))
                    }}
                    className="w-full mt-1 border border-gray-300 rounded px-1 py-1 text-xs"
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
                  <Link href={`/products/${product.slug}`} className="block mt-1">
                    <h3 className="font-medium hover:text-yellow-600 cursor-pointer text-sm line-clamp-2">{product.name}</h3>
                  </Link>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-bold text-sm">₹{price}</p>
                    <div className="flex space-x-1">
                      <button
onClick={() => handleAddToCart({
                           id: product.id + `-${selectedVariant.size}`,
                           productId: product.id,
                           name: `${product.name} (${selectedVariant.size})`,
                           slug: product.slug,
                           price,
                           images: images,
                           selectedVariant,
                           stock: product.stockGrams
                         })}
                        style={{ backgroundColor: settings.themeColor || '#3b82f6' }}
                        className={`flex-1 text-white px-2 py-1 rounded text-xs font-bold hover:opacity-90 ${!inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!inStock}
                      >
                        Cart
                      </button>
                      <a
                        style={{ backgroundColor: settings.themeColor || '#FFD60A' }}
                        className="flex-1 text-black px-2 py-1 rounded text-xs font-bold text-center hover:opacity-90"
                        href={`/products/${product.slug}`}
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div 
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] space-y-2"
          style={{ display: toasts.length > 0 ? 'block' : 'none' }}
        >
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
    </div>
  )
}

export default ProductList