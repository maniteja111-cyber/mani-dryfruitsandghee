'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/app/contexts/CartContext'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  pricePerKg: number | null
  stockGrams: number
  images: string[] | any
  category?: { name: string }
  categoryId?: string
  origin?: string | null
  benefits?: string | null
  ingredients?: string | null
  nutritionalInfo?: string | null
  storageInstructions?: string | null
  shelfLife?: string | null
  brand?: string | null
}

interface Review {
  id: string
  name: string
  phone: string
  rating: number
  comment: string
  createdAt: string
}

interface ProductDetailProps {
  product: Product
  settings: Record<string, string>
  relatedProducts?: Product[]
}

const VARIANTS = [
  { size: '125g', grams: 125 },
  { size: '250g', grams: 250 },
  { size: '500g', grams: 500 },
  { size: '1kg', grams: 1000 }
]

function calculatePrice(basePricePerKg: number | null, grams: number): number {
  if (!basePricePerKg) return 0
  const kgPrice = basePricePerKg
  const price = (kgPrice * grams) / 1000
  if (grams === 500) return Math.round(kgPrice * 0.56)
  if (grams === 250) return Math.round(kgPrice * 0.31)
  if (grams === 125) return Math.round(kgPrice * 0.19)
  return Math.round(kgPrice)
}

export default function ProductDetail({ product, settings, relatedProducts = [] }: ProductDetailProps) {
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
    } catch {
      images = [product.images]
    }
  }
  images = images.map(img => {
    if (typeof img === 'string' && img.trim().startsWith('"')) {
      try { return JSON.parse(img) } catch { return img }
    }
    return img
  })

  const [selectedVariant, setSelectedVariant] = useState(VARIANTS[3])
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [inWishlist, setInWishlist] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewCount, setReviewCount] = useState(0)
  const [reviewForm, setReviewForm] = useState({ name: '', phone: '', rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [pincode, setPincode] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState<{available: boolean, days: string, cod: boolean, shipping: string} | null>(null)
  const [activeTab, setActiveTab] = useState('description')
  const { addItem } = useCart()
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const handleAddToCart = (item: any) => {
    addItem(item)
    showToast(`${item.name} added to cart!`, 'success')
  }

  const stockGramsRemaining = product.stockGrams
  const stockKg = (stockGramsRemaining / 1000).toFixed(2)

  useEffect(() => {
    const saved = localStorage.getItem('wishlist')
    if (saved) {
      const list = JSON.parse(saved)
      setInWishlist(list.includes(product.id))
    }
  }, [product.id])

  useEffect(() => {
    fetchReviews()
  }, [product.id])

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${product.id}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
        setReviewCount(data.length)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const checkDelivery = async () => {
    if (!pincode || pincode.length !== 6) return
    setDeliveryInfo({ available: true, days: '2-5', cod: true, shipping: 'Free' })
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingReview(true)
    setReviewMessage('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          ...reviewForm
        })
      })

      if (res.ok) {
        setReviewMessage('Review submitted! Will be published after approval.')
        setReviewForm({ name: '', phone: '', rating: 5, comment: '' })
        fetchReviews()
      } else {
        const error = await res.json()
        setReviewMessage(error.error || 'Error submitting review. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      setReviewMessage('Error submitting review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const maskName = (name: string) => {
    if (name.length <= 2) return name
    return name.charAt(0) + '***' + name.charAt(name.length - 1)
  }

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone
    return '******' + phone.slice(-4)
  }

  const toggleWishlist = async () => {
    const userStr = localStorage.getItem('user')
    let newState = !inWishlist

    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        const method = newState ? 'POST' : 'DELETE'
        await fetch('/api/wishlist', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: user.phone, productId: product.id })
        })
      } catch {}
    }

    let list = JSON.parse(localStorage.getItem('wishlist') || '[]')
    if (newState) {
      if (!list.includes(product.id)) list.push(product.id)
    } else {
      list = list.filter((id: string) => id !== product.id)
    }
    localStorage.setItem('wishlist', JSON.stringify(list))

    setInWishlist(newState)
  }

  const price = calculatePrice(product.pricePerKg, selectedVariant.grams)
  const maxQuantity = Math.floor(stockGramsRemaining / selectedVariant.grams)
  const maxKg = (stockGramsRemaining / 1000).toFixed(2)
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 4.5

  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=Hi, I'm interested in ${product.name} (${selectedVariant.size}). Quantity: ${quantity}. Please share details.`

  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length
  }))

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 mb-12">
          <div>
            <div className="aspect-[1/1] relative mb-4 rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
<Image
                    src={images[selectedImage] && images[selectedImage] !== '' ? images[selectedImage] : '/placeholder.svg'}
                    alt={`${product.name} - Buy ${product.name} Online at Mani Dry Fruits & Ghee Store`}
                    fill
                    sizes="(max-width: 768px) 90vw, 40vw"
                    loading="eager"
                    className="object-cover"
                  />
            </div>
            {images.length > 1 && Array.isArray(images) && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                      selectedImage === index ? 'border-yellow-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image && image !== '' ? image : '/placeholder.svg'}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
            
            {product.shortDescription && (
              <p className="text-gray-600 mb-4">{product.shortDescription}</p>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-lg">★★★★★</span>
                <span className="text-gray-600 text-sm font-medium">{avgRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 text-sm">{reviewCount} Reviews</span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">₹{price}</span>
                <span className="text-gray-500 text-sm">({selectedVariant.size})</span>
              </div>
              <p className="text-gray-600">Stock: {stockKg} kg available</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="text-lg mb-1 block">📦</span>
                <span className="text-xs">Freshly Packed</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="text-lg mb-1 block">✅</span>
                <span className="text-xs">Quality Checked</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="text-lg mb-1 block">💳</span>
                <span className="text-xs">Secure Pay</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="text-lg mb-1 block">🚚</span>
                <span className="text-xs">Fast Delivery</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="text-lg mb-1 block">💬</span>
                <span className="text-xs">Whatsapp</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Weight</label>
              <div className="flex flex-wrap gap-3">
                {VARIANTS.map((variant) => (
                  <button
                    key={variant.size}
                    onClick={() => {
                      setSelectedVariant(variant)
                      setQuantity(1)
                    }}
                    disabled={Math.floor(stockGramsRemaining / variant.grams) === 0}
                    className={`px-5 py-3 rounded-xl border-2 font-medium transition ${
                      selectedVariant.size === variant.size
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : Math.floor(stockGramsRemaining / variant.grams) === 0
                          ? 'border-gray-200 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Check Delivery</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Enter Pincode"
                  maxLength={6}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3"
                />
                <button
                  onClick={checkDelivery}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition"
                >
                  Check
                </button>
              </div>
              {deliveryInfo && (
                <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-700 font-medium">✓ Delivery Available</p>
                      <p className="text-gray-600 text-sm">Estimated: {deliveryInfo.days} Days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">COD: {deliveryInfo.cod ? 'Yes' : 'No'}</p>
                      <p className="text-gray-600 text-sm">Shipping: {deliveryInfo.shipping}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={maxQuantity === 0}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-500 text-sm">Max: {maxKg} kg</span>
              </div>

<div className="space-y-3">
                <button
                  onClick={() => handleAddToCart({
                    id: product.id + `-${selectedVariant.size}`,
                    productId: product.id,
                    name: `${product.name} (${selectedVariant.size})`,
                    slug: product.slug,
                    price: price,
                    images: images,
                    stock: maxQuantity,
                    selectedVariant,
                    quantity
                  })}
                  disabled={maxQuantity === 0}
                  className="w-full py-4 bg-yellow-600 text-white rounded-xl font-semibold text-lg hover:bg-yellow-700 transition disabled:opacity-50"
                >
                  Add to Cart
                </button>
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition text-center block"
                >
                  Buy Now on WhatsApp
                </Link>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-gray-700"><strong>Free Shipping:</strong> On orders above ₹999</p>
              <p className="text-gray-700"><strong>Freshly Prepared:</strong> Products made fresh on order</p>
              <p className="text-gray-700"><strong>Secure Packaging:</strong> Hygienic tamper-proof packaging</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 font-semibold transition ${
                  activeTab === 'description'
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`pb-3 font-semibold transition ${
                  activeTab === 'specifications'
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 font-semibold transition ${
                  activeTab === 'reviews'
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Reviews ({reviewCount})
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-16 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } animate-slide-in`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  )
}