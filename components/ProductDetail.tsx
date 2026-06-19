'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/app/contexts/CartContext'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: number
  discountPrice?: number | null
  stock: number
  images: string[] | any
  category: { name: string }
  categoryId?: string
  measurementType?: string
  variants?: any
  origin?: string | null
  benefits?: string | null
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
}

export default function ProductDetail({ product, settings }: ProductDetailProps) {
  let images = []
  try {
    images = JSON.parse(product.images as string)
  } catch (error) {
    images = product.images && typeof product.images === 'string' && product.images.trim() ? [product.images] : []
  }

  let variants = []
  try {
    variants = product.variants || []
  } catch {}

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(variants[0])
  const [inWishlist, setInWishlist] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewCount, setReviewCount] = useState(0)
  const [reviewForm, setReviewForm] = useState({ name: '', phone: '', rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [pincode, setPincode] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState<{available: boolean, days: string, cod: boolean} | null>(null)
  const { addItem } = useCart()

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
    setDeliveryInfo({ available: true, days: '2-5', cod: true })
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

  const measurementType = product.measurementType || 'quantity'
  const isWeight = measurementType === 'weight'
  const price = selectedVariant?.discountPrice || selectedVariant?.price || product.discountPrice || product.price
  const mrp = selectedVariant?.price || product.price
  const savings = mrp - price
  const savingsPercent = Math.round((savings / mrp) * 100)

  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=Hi, I'm interested in ${product.name}. Quantity: ${quantity}. Please share details.`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-10">
          <div>
            <div className="aspect-[1/1] relative mb-4 rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={images[selectedImage] && images[selectedImage] !== '' ? images[selectedImage] : '/placeholder.svg'}
                alt={`Buy ${product.name} Online India | MANI DRY FRUITS`}
                fill
                sizes="(max-width: 768px) 90vw, 50vw"
                loading="eager"
                className="object-cover"
              />
            </div>
            {images.length > 1 && (
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
                      alt={`Thumbnail ${index + 1}`}
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
                <span className="text-gray-600 text-sm">(4.5)</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 text-sm">Reviews (0)</span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">₹{price}</span>
                {mrp > price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">₹{mrp}</span>
                    <span className="text-green-600 font-semibold">{savingsPercent}% off</span>
                  </>
                )}
              </div>
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
                <span className="text-xs">Whatsapp Support</span>
              </div>
            </div>

            {variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {isWeight ? 'Select Weight' : 'Select Pack Size'}
                </label>
                <div className="flex flex-wrap gap-3">
                  {variants.map((variant: any) => (
                    <button
                      key={variant.size}
                      onClick={() => {
                        setSelectedVariant(variant)
                        setQuantity(1)
                      }}
                      className={`px-5 py-3 rounded-xl border-2 font-medium transition ${
                        selectedVariant?.size === variant.size
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {variant.size}
                      {isWeight && variant.weightGrams && ` (${variant.weightGrams}g)`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter Pincode for Delivery</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 500001"
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
                  <p className="text-green-700 font-medium">✓ Delivery Available</p>
                  <p className="text-gray-600 text-sm">Estimated: {deliveryInfo.days} Days</p>
                  <p className="text-gray-600 text-sm">COD: {deliveryInfo.cod ? 'Available' : 'Not Available'}</p>
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
                    onClick={() => setQuantity(Math.min(50, quantity + 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-500 text-sm">Max: 50 packs</span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => addItem({
                    id: product.id + (selectedVariant ? `-${selectedVariant.size}` : ''),
                    productId: product.id,
                    name: `${product.name}${selectedVariant ? ` (${selectedVariant.size})` : ''}`,
                    slug: product.slug,
                    price: selectedVariant?.price || product.price,
                    discountPrice: selectedVariant?.discountPrice || product.discountPrice,
                    images: images,
                    selectedVariant
                  })}
                  className="w-full py-4 bg-yellow-600 text-white rounded-xl font-semibold text-lg hover:bg-yellow-700 transition"
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
      </div>
    </div>
  )
}