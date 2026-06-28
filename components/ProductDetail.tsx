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
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr] gap-8 mb-8">
          <div>
            <div className="aspect-[1/1] relative mb-3 rounded-lg overflow-hidden bg-gray-100 shadow-md">
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
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition ${
                      selectedImage === index ? 'border-yellow-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image && image !== '' ? image : '/placeholder.svg'}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            {product.shortDescription && (
              <p className="text-gray-600 mb-3">{product.shortDescription}</p>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-sm">★★★★★</span>
                <span className="text-gray-600 text-sm font-medium">{avgRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 text-sm">{reviewCount} Reviews</span>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-gray-900">₹{price}</span>
                <span className="text-gray-500 text-sm">({selectedVariant.size})</span>
              </div>
              <p className="text-gray-600 text-sm">Stock: {stockKg} kg available</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              <div className="bg-gray-50 rounded-md p-2 text-center">
                <span className="text-sm mb-1 block">📦</span>
                <span className="text-xs">Freshly Packed</span>
              </div>
              <div className="bg-gray-50 rounded-md p-2 text-center">
                <span className="text-sm mb-1 block">✅</span>
                <span className="text-xs">Quality Checked</span>
              </div>
              <div className="bg-gray-50 rounded-md p-2 text-center">
                <span className="text-sm mb-1 block">💳</span>
                <span className="text-xs">Secure Pay</span>
              </div>
              <div className="bg-gray-50 rounded-md p-2 text-center">
                <span className="text-sm mb-1 block">🚚</span>
                <span className="text-xs">Fast Delivery</span>
              </div>
              <div className="bg-gray-50 rounded-md p-2 text-center">
                <span className="text-sm mb-1 block">💬</span>
                <span className="text-xs">Whatsapp</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Weight</label>
              <div className="flex flex-wrap gap-2">
                {VARIANTS.map((variant) => (
                  <button
                    key={variant.size}
                    onClick={() => {
                      setSelectedVariant(variant)
                      setQuantity(1)
                    }}
                    disabled={Math.floor(stockGramsRemaining / variant.grams) === 0}
                    className={`px-3 py-2 rounded-md border-2 font-medium transition text-sm ${
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Delivery</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Enter Pincode"
                  maxLength={6}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={checkDelivery}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition text-sm"
                >
                  Check
                </button>
              </div>
              {deliveryInfo && (
                <div className="mt-2 p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-700 font-medium text-sm">✓ Delivery Available</p>
                      <p className="text-gray-600 text-xs">Estimated: {deliveryInfo.days} Days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-xs">COD: {deliveryInfo.cod ? 'Yes' : 'No'}</p>
                      <p className="text-gray-600 text-xs">Shipping: {deliveryInfo.shipping}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-base hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={maxQuantity === 0}
                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-base hover:bg-gray-100 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-500 text-sm">Max: {maxKg} kg</span>
              </div>

              <div className="space-y-2">
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
                  className="w-full py-3 bg-yellow-600 text-white rounded-lg font-semibold text-base hover:bg-yellow-700 transition disabled:opacity-50"
                >
                  Add to Cart
                </button>
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold text-base hover:bg-green-700 transition text-center block"
                >
                  Buy Now on WhatsApp
                </Link>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-gray-700 text-sm"><strong>Free Shipping:</strong> On orders above ₹999</p>
              <p className="text-gray-700 text-sm"><strong>Freshly Prepared:</strong> Products made fresh on order</p>
              <p className="text-gray-700 text-sm"><strong>Secure Packaging:</strong> Hygienic tamper-proof packaging</p>
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

          <div className="min-h-[200px]">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Product Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description || product.shortDescription || `${product.name} - Premium quality product.`}
                  </p>
                </div>

                {product.ingredients && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Ingredients</h4>
                    <p className="text-gray-600">{product.ingredients}</p>
                  </div>
                )}

                {product.benefits && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Benefits</h4>
                    <p className="text-gray-600">{product.benefits}</p>
                  </div>
                )}

                {product.storageInstructions && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Storage Instructions</h4>
                    <p className="text-gray-600">{product.storageInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Product Specifications</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      <tr><td className="py-3 font-medium text-gray-700">Category</td><td className="py-3">{product.category?.name || '-'}</td></tr>
                      <tr><td className="py-3 font-medium text-gray-700">Origin</td><td className="py-3">{product.origin || '-'}</td></tr>
                      <tr><td className="py-3 font-medium text-gray-700">Shelf Life</td><td className="py-3">{product.shelfLife || '-'}</td></tr>
                      <tr><td className="py-3 font-medium text-gray-700">Storage</td><td className="py-3">{product.storageInstructions || '-'}</td></tr>
                      <tr><td className="py-3 font-medium text-gray-700">Ingredients</td><td className="py-3">{product.ingredients || '-'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                    <p className="text-yellow-500 text-lg">{'★'.repeat(5)}</p>
                    <p className="text-gray-500 text-sm">{reviewCount} reviews</p>
                  </div>
                  <div className="flex-1">
                    {ratingBreakdown.map(({rating, count}) => (
                      <div key={rating} className="flex items-center gap-2 mb-1">
                        <span className="text-sm w-8">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${reviewCount > 0 ? (count / reviewCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Write a Review</h4>
                  <form onSubmit={submitReview} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={reviewForm.phone}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Rating</label>
                      <select
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                        <option value={4}>⭐⭐⭐⭐ Very Good</option>
                        <option value={3}>⭐⭐⭐ Good</option>
                        <option value={2}>⭐⭐ Fair</option>
                        <option value={1}>⭐ Poor</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Your review..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={4}
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    {reviewMessage && <p className="text-green-600 text-sm">{reviewMessage}</p>}
                  </form>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{maskName(review.name)}</span>
                        <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium bg-green-600`}
            style={{ animation: 'toast-fade 3s ease-in-out forwards' }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  )
}