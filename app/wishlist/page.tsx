'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/app/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface WishlistProduct {
  id: string
  name: string
  slug: string
  price: number
  discountPrice?: number | null
  images: string[] | any
}

export default function WishlistPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchWishlistFromAPI = async (phoneOrId: string) => {
    try {
      const isPhone = /^\d{10}$/.test(phoneOrId)
      const param = isPhone ? `phone=${phoneOrId}` : `userId=${phoneOrId}`
      const res = await fetch(`/api/wishlist?${param}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('API wishlist error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocalWishlist = async (ids: string[]) => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const all = await res.json()
        const filtered = all.filter((p: any) => ids.includes(p.id))
        setProducts(filtered)
      }
    } catch (error) {
      console.error('Local wishlist error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    const saved = localStorage.getItem('wishlist')
    const localIds = saved ? JSON.parse(saved) : []

    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        fetchWishlistFromAPI(user.phone || user.id)
      } catch {
        if (localIds.length > 0) fetchLocalWishlist(localIds)
        else setLoading(false)
      }
    } else {
      if (localIds.length > 0) fetchLocalWishlist(localIds)
      else setLoading(false)
    }
  }, [])

  const removeFromWishlist = async (id: string) => {
    const userStr = localStorage.getItem('user')

    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: user.phone,
            productId: id
          })
        })
      } catch (e) {
        console.error('Failed to remove from server wishlist')
      }
    }

    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const addToCart = (product: WishlistProduct) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice === null ? undefined : product.discountPrice,
      images: Array.isArray(product.images) ? product.images : (typeof product.images === 'string' ? [product.images] : []),
    })
    alert('Added to cart!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header settings={settings} />
        <main className="flex-1">
          <div className="flex items-center justify-center py-12">
            Loading your wishlist...
          </div>
        </main>
        <Footer settings={settings} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header settings={settings} />
      <main>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500 mb-4">Your wishlist is empty</p>
              <Link href="/products" className="text-yellow-600 hover:underline">
                Browse products →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl shadow p-4">
                  <img 
                    src={Array.isArray(product.images) ? product.images[0] : product.images} 
                    alt={product.name} 
                    className="h-48 w-full object-cover rounded-xl mb-4" 
                  />
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold">₹{product.discountPrice || product.price}</span>
                    {product.discountPrice && <span className="line-through text-gray-400">₹{product.price}</span>}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => addToCart(product)}
                      className="flex-1 bg-yellow-600 text-white py-2 rounded-xl font-medium hover:bg-yellow-700"
                    >
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => removeFromWishlist(product.id)}
                      className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-red-50 text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer settings={settings} />
    </div>
  )
}