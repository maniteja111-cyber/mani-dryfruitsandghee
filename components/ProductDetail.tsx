'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/app/contexts/CartContext'
import { getSelectorLabel, getUnitSymbol, VariantPrice } from '@/app/services/pricing.service'
import { getImageSrc, isValidImageUrl, shouldUseNextImage } from '@/lib/image-utils'

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
  extension?: {
    unitTypeId: string | null
    basePrice: number | null
    pricingTemplateId: string | null
    stockQuantity: number | null
    masterUnit?: { id: string; code: string; name: string; type: string; symbol: string | null } | null
  } | null
  productVariants?: { variantId: string; variant?: { id: string; value: string; label: string; unit: { code: string; type: string; symbol: string | null } } }[]
  variantPrices?: NormalizedVariant[]
  defaultVariant?: NormalizedVariant | null
  productType: string | null
  unitSymbol: string
  selectorLabel: string
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

  const validImages = images.filter(img => typeof img === 'string' && isValidImageUrl(img))
  const primaryImage = validImages[0] || '/placeholder.svg'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleImageError = () => {
    // Image failed to load, will use fallback
  }

  const displayImage = (index: number) => {
    return validImages[index] || '/placeholder.svg'
  }

  const [availableVariants, setAvailableVariants] = useState<NormalizedVariant[]>(product.variantPrices || [])
  const [selectedVariant, setSelectedVariant] = useState<NormalizedVariant | null>(
    product.defaultVariant || (product.variantPrices && product.variantPrices.length > 0 ? product.variantPrices[0] : null)
  )
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
  const { addItem, items } = useCart()
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log('TOAST DEBUG - showToast called with:', message, type)
    const id = Date.now()
    setToasts(prev => {
      console.log('TOAST DEBUG - previous toasts:', prev.length)
      return [...prev, { id, message, type }]
    })
    setTimeout(() => {
      console.log('TOAST DEBUG - removing toast id:', id)
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const handleAddToCart = (item: any) => {
    console.log('TOAST DEBUG - handleAddToCart clicked')
    
    const otherVariantsInCart = items.filter(i => i.productId === item.productId).reduce((sum, i) => sum + (i.selectedVariant?.grams || 1000) * i.quantity, 0)
    const availableGrams = Math.max(0, (item.stock || 0) - otherVariantsInCart)
    const maxQuantity = Math.max(0, Math.floor(availableGrams / (item.selectedVariant?.grams || 1000)))
    
    if (maxQuantity <= 0) {
      showToast(`${item.name} - Not enough stock!`, 'error')
      return
    }
    
    addItem(item)
    showToast(`${item.name} added to cart!`, 'success')
  }

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

  const stockGramsRemaining = product.stockGrams

  const price = selectedVariant?.price ?? product.pricePerKg ?? 0
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
  
  const maxKg = (available / 1000).toFixed(2)
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 4.5

  const unitSymbol = product.unitSymbol || getUnitSymbol(product.productType)
  const displayLabel = selectedVariant?.label || selectedVariant?.size || '1kg'
  const stockDisplay = productType === 'weight'
    ? `${(available / 1000).toFixed(2)} ${unitSymbol} available`
    : `${available} ${unitSymbol} available`
  const maxDisplay = productType === 'weight'
    ? `Max: ${maxKg} ${unitSymbol} available`
    : `Max: ${maxQuantity} ${unitSymbol} available`
  
  const selectorLabel = product.selectorLabel || getSelectorLabel(product.productType)

  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=Hi, I'm interested in ${product.name} (${displayLabel}). Quantity: ${quantity}. Please share details.`

  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length
  }))

  return (
    <>
    <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr] gap-8 mb-8">
          <div>
            <div className="aspect-[1/1] relative mb-3 rounded-lg overflow-hidden bg-gray-100 shadow-md">
              <Image
                src={displayImage(selectedImageIndex)}
                alt={`${product.name} - Buy ${product.name} Online at Mani Dry Fruits & Ghee Store`}
                fill
                sizes="(max-width: 768px) 90vw, 40vw"
                loading="eager"
                className="object-cover"
                onError={handleImageError}
              />
            </div>
            {validImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {validImages.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition ${
                      selectedImageIndex === index ? 'border-yellow-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      onError={handleImageError}
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
                <span className="text-gray-500 text-sm">({displayLabel})</span>
              </div>
              <p className="text-gray-600 text-sm">{stockDisplay}</p>
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
              {availableVariants.length > 0 ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{selectorLabel}</label>
                  <div className="flex flex-wrap gap-2">
                    {availableVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant)
                          setQuantity(1)
                        }}
                        formNoValidate
                        className={`px-3 py-2 rounded-md border-2 font-medium transition text-sm ${
                          selectedVariant?.id === variant.id
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div>{variant.size}</div>
                          <div className="text-xs text-gray-600">₹{variant.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-md">
                  <p className="text-gray-600">No variants configured for this product</p>
                </div>
              )}
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
                    disabled={quantity >= maxQuantity || maxQuantity === 0}
                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-base hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-500 text-sm">{maxDisplay}</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleAddToCart({
                    id: product.id + `-${selectedVariant?.id || selectedVariant?.size}`,
                    productId: product.id,
                    name: `${product.name} (${displayLabel})`,
                    slug: product.slug,
                    price: price,
                    images: images,
                    stock: product.productType === 'weight' ? product.stockGrams : (product.extension?.stockQuantity || 0),
                    selectedVariant: {
                      id: selectedVariant?.id,
                      size: selectedVariant?.size,
                      label: selectedVariant?.label,
                      grams: selectedVariant?.grams,
                      unitType: selectedVariant?.unitType
                    },
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
                        <option key="5" value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                        <option key="4" value={4}>⭐⭐⭐⭐ Very Good</option>
                        <option key="3" value={3}>⭐⭐⭐ Good</option>
                        <option key="2" value={2}>⭐⭐ Fair</option>
                        <option key="1" value={1}>⭐ Poor</option>
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
      <div 
        className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] space-y-2"
        style={{ display: toasts.length > 0 ? 'block' : 'none' }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 min-w-[200px] justify-center ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {toast.type === 'error' ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </>
  )
}