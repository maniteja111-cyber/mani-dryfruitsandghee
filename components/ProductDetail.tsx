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
  price: number
  discountPrice?: number | null
  stock: number
  images: string[] | any
  category: { name: string }
  categoryId?: string
  measurementType?: string
  variants?: any
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

  const variantText = selectedVariant ? ` (${selectedVariant.size})` : ''
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=Hi, I'm interested in ${product.name}${variantText}. Quantity: ${quantity}. Please share details.`

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Images */}
      <div>
        <div className="aspect-square relative mb-4">
          <Image
            src={images[selectedImage] && images[selectedImage] !== '' ? images[selectedImage] : '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
          />

          <button
              onClick={toggleWishlist}
              className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow hover:bg-white transition"
            >
              <span className="text-2xl" style={{ color: inWishlist ? (settings.themeColor || '#ef4444') : '#9ca3af' }}>
                {inWishlist ? '♥' : '♡'}
              </span>
            </button>
        </div>
        {images.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto">
            {images.map((image: string, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-16 h-16 relative rounded border-2 ${
                  selectedImage === index ? 'border-yellow-500' : 'border-gray-200'
                }`}
              >
                <Image
                  src={image && image !== '' ? image : '/placeholder.jpg'}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  className="object-cover rounded"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div>
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-gray-700">Products</Link>
          <span className="mx-2">/</span>
          <Link href={`/products?category=${product.categoryId}`} className="hover:text-gray-700">
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

        {/* Variant Selection */}
        {variants.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isWeight ? 'Select Weight' : 'Select Pack Size'}
            </label>
            <select
              value={selectedVariant?.size || ''}
              onChange={(e) => {
                const variant = variants.find((v: any) => v.size === e.target.value)
                setSelectedVariant(variant)
                setQuantity(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {variants.map((variant: any) => (
                <option key={variant.size} value={variant.size}>
                  {variant.size} — ₹{variant.discountPrice || variant.price}
                  {variant.weightGrams && ` (${variant.weightGrams}g)`}
                  {variant.pieces && ` (${variant.pieces} pc)`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              ₹{selectedVariant?.discountPrice || selectedVariant?.price || product.discountPrice || product.price}
            </span>
            {(selectedVariant?.discountPrice || product.discountPrice) && (
              <span className="text-xl text-gray-400 line-through">
                ₹{selectedVariant?.price || product.price}
              </span>
            )}
          </div>

          {selectedVariant?.discountPrice && selectedVariant.price && (
            <div className="text-sm text-green-600 mt-1">
              You save ₹{selectedVariant.price - selectedVariant.discountPrice} 
              ({Math.round(((selectedVariant.price - selectedVariant.discountPrice) / selectedVariant.price) * 100)}%)
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-6">{product.description}</p>

{/* Stock Status */}
         <div className="mb-6">
           {product.stock > 0 ? (
             <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
               {isWeight 
                 ? `In Stock — ${product.stock >= 1000 ? (product.stock / 1000) + 'kg' : product.stock + 'g'} available` 
                 : `In Stock — ${product.stock} units available`}
             </span>
           ) : (
             <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
               Currently Out of Stock
             </span>
           )}
         </div>

        {product.stock > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 w-20">
                {isWeight ? 'No. of Packs' : 'Quantity'}
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-lg hover:bg-gray-100 rounded-l-lg"
                >
                  −
                </button>
                <span className="px-5 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(50, quantity + 1))}
                  className="px-4 py-2 text-lg hover:bg-gray-100 rounded-r-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
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
                style={{ backgroundColor: settings.themeColor || '#f59e0b', color: '#fff' }}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-colors hover:opacity-90"
              >
                Add to Cart
              </button>
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: settings.themeColor || '#10b981', color: '#fff' }}
                className="flex-1 px-6 py-3 rounded-lg transition-colors text-center hover:opacity-90"
              >
                Order Now
              </Link>
            </div>
          </div>
        )}

<div className="mt-8 border-t pt-8">
           <h3 className="text-lg font-semibold mb-4">Product Information</h3>
           <div className="space-y-2 text-sm text-gray-600">
             <p><strong>Category:</strong> {product.category.name}</p>
             <p><strong>Sold as:</strong> {isWeight ? 'By Weight (grams/kg)' : 'By Quantity (pieces/packs)'}</p>
             <p><strong>Total Stock:</strong> {product.stock > 0 ? `${product.stock >= 1000 ? (product.stock / 1000) + ' kg' : product.stock + ' g'} available` : 'Out of stock'}</p>
           </div>
           {isWeight && (
             <p className="text-xs text-gray-500 mt-2">Each pack above contains the weight shown in the variant selector.</p>
           )}
         </div>

        {/* Reviews Section */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-2xl font-bold mb-6">Customer Reviews ({reviewCount})</h3>

{/* Review Form */}
           <div className="bg-gray-50 rounded-lg p-6 mb-8">
             <h4 className="font-semibold mb-4">Write a Review</h4>
             <form onSubmit={submitReview} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input
                   type="text"
                   placeholder="Your Name"
                   value={reviewForm.name}
                   onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                   className="border border-gray-300 rounded px-3 py-2"
                   required
                 />
                 <input
                   type="tel"
                   placeholder="Phone Number"
                   value={reviewForm.phone}
                   onChange={(e) => setReviewForm(prev => ({ ...prev, phone: e.target.value }))}
                   className="border border-gray-300 rounded px-3 py-2"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2">Rating</label>
                 <select
                   value={reviewForm.rating}
                   onChange={(e) => setReviewForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                   className="border border-gray-300 rounded px-3 py-2"
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
                 className="w-full border border-gray-300 rounded px-3 py-2"
                 rows={4}
                 required
               />
               <div className="flex items-center justify-between">
                 <button
                   type="submit"
                   disabled={submittingReview}
                   className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                 >
                   {submittingReview ? 'Submitting...' : 'Submit Review'}
                 </button>
                 {reviewMessage && <p className="text-green-600 text-sm">{reviewMessage}</p>}
               </div>
             </form>
           </div>

          {/* Display Reviews */}
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{maskName(review.name)}</span>
                    <span className="text-gray-500 text-sm">({maskPhone(review.phone)})</span>
                    <span className="text-yellow-500">
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}