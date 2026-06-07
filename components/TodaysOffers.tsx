'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/app/contexts/CartContext'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discountPrice?: number | null
  images: any
  stock: number
  category?: { name: string }
  variants?: any
}

interface TodaysOffersProps {
  products: Product[]
}

export default function TodaysOffers({ products }: TodaysOffersProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({})
  const { addItem } = useCart()
  if (!products || products.length === 0) {
    return null
  }

return (
       <section className="py-12 bg-red-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">🔥 Today's Offers</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
             {products.map((product) => {
               let images = []
               if (product.images) {
                 if (typeof product.images === 'string') {
                   try {
                     const parsed = JSON.parse(product.images)
                     images = Array.isArray(parsed) ? parsed : []
                   } catch {}
                 } else if (Array.isArray(product.images)) {
                   images = product.images
                 }
               }
               const imageSrc = images[0]?.url || images[0] || ''

               let variants = []
               if (product.variants) {
                 if (typeof product.variants === 'string') {
                   try { variants = JSON.parse(product.variants) } catch {}
                 } else {
                   variants = product.variants
                 }
               }
               const selectedVariant = selectedVariants[product.id] || variants[0]

               return (
                 <div key={product.id} className="bg-white rounded-2xl shadow p-4">
                   {images && images.length > 0 ? (
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
                  {product.stock === 0 && (
                    <div className="mt-2 text-center">
                      <span className="bg-red-500 text-white px-2 py-1 text-xs rounded">Out of Stock</span>
                    </div>
                  )}
                  <h3 className="font-bold mt-3">{product.name}</h3>

                  {/* Variant Select + Price */}
                  <select
                    value={selectedVariant?.size || ''}
                    onChange={(e) => {
                      const variant = variants.find((v: any) => v.size === e.target.value) || { size: 'Standard', price: product.price, discountPrice: product.discountPrice }
                      setSelectedVariants(prev => ({ ...prev, [product.id]: variant }))
                    }}
                    className="w-full mt-2 border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {(variants.length > 0 ? variants : [{ size: 'Standard', price: product.price, discountPrice: product.discountPrice }]).map((variant: any) => (
                      <option key={variant.size} value={variant.size}>
                        {variant.size} - ₹{variant.discountPrice || variant.price}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center space-x-2 mt-1">
                    {(() => {
                      const currentPrice = selectedVariant?.discountPrice || selectedVariant?.price || product.discountPrice || product.price
                      const originalPrice = selectedVariant?.price || product.price
                      return (
                        <>
                          <p className="font-bold text-xl">₹{currentPrice}</p>
                          {((selectedVariant?.discountPrice || product.discountPrice) && originalPrice !== currentPrice) && (
                            <p className="text-sm text-gray-500 line-through">₹{originalPrice}</p>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  <div className="flex space-x-2 mt-3">
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
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-red-700"
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