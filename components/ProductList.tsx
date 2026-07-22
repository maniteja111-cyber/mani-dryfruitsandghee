'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/app/contexts/CartContext'
import { getUnitSymbol } from '@/app/services/pricing.service'
import { isValidImageUrl } from '@/lib/image-utils'
import Link from 'next/link'
import Image from 'next/image'

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
  images: string[] | any
  category: { name: string }
  extension?: {
    stockQuantity: number | null
    masterUnit?: { type: string | null }
    basePrice?: number
  } | null
  variantPrices?: NormalizedVariant[]
  productType: string | null
  unitSymbol: string
  priceDisplay?: string
  hasStock?: boolean
  stockQuantity?: number
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

  const getCategoryValue = () => {
    const urlCategory = params.get('category')
    return urlCategory || (searchParams.category as string) || ''
  }

  const getSortValue = () => {
    const urlSort = params.get('sort')
    const urlOrder = params.get('order')
    const propSort = searchParams.sort
    const propOrder = searchParams.order
    return `${urlSort || propSort || 'createdAt'}-${urlOrder || propOrder || 'desc'}`
  }

  const getSearchValue = () => {
    return params.get('search') || (searchParams.search as string) || ''
  }

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
    const availableGrams = Math.max(0, (item.stock || 0) - otherVariantsInCart)
    const maxQuantity = Math.max(0, Math.floor(availableGrams / (item.selectedVariant?.grams || 1000)))
    
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
      const sp = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          if (Array.isArray(val)) {
            val.forEach(v => sp.append(key, v))
          } else {
            sp.set(key, val)
          }
        }
      })
      const res = await fetch(`/api/products?${sp}`)
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
              value={getCategoryValue()}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option key="all-categories" value="">All Categories</option>
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
              value={getSortValue()}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-')
                updateFilters({ sort, order })
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option key="newest" value="createdAt-desc">Newest First</option>
              <option key="oldest" value="createdAt-asc">Oldest First</option>
              <option key="price-low" value="price-asc">Price: Low to High</option>
              <option key="price-high" value="price-desc">Price: High to Low</option>
              <option key="name-a" value="name-asc">Name: A to Z</option>
              <option key="name-z" value="name-desc">Name: Z to A</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              defaultValue={getSearchValue()}
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
              const price = selectedVariant?.price ?? (product.priceDisplay ? parseFloat(product.priceDisplay.replace('₹', '').split('/')[0]) : product.pricePerKg ?? 0)
              const productType = selectedVariant?.unitType || product.productType
              const hasStock = product.hasStock ?? (product.stockGrams > 0 || (product.extension?.stockQuantity ?? 0) > 0)
              const hasPricing = !!(product.extension?.basePrice || product.pricePerKg)
              const inStock = hasStock || availableVariants.length > 0 || hasPricing

              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm p-3">
                  <Link href={`/products/${product.slug}`} className="relative block">
                    {validImages.length > 0 ? (
                      <img
                        src={imageSrc}
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
                    value={selectedVariant?.id || ''}
                    onChange={(e) => {
                      const variant = availableVariants.find((v) => v.id === e.target.value)
                      if (variant) setSelectedVariants(prev => ({ ...prev, [product.id]: variant }))
                    }}
                    className="w-full mt-1 border border-gray-300 rounded px-1 py-1 text-xs"
                  >
                    {availableVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.size} - ₹{variant.price}
                      </option>
                    ))}
                    {availableVariants.length === 0 && (
                      <option key="out-of-stock" value="">Out of Stock</option>
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
                          stock: product.stockQuantity ?? (productType === 'weight' ? product.stockGrams : (product.extension?.stockQuantity || 0)),
                          quantity: 1
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