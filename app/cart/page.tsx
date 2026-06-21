'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '@/app/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Confetti from '@/components/Confetti'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart()
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [user, setUser] = useState<any>(null)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [redeemedPoints, setRedeemedPoints] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      fetchLoyaltyPoints(userData.phone)
    }
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        setSettings(await res.json())
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchLoyaltyPoints = async (phone: string) => {
    try {
      const res = await fetch(`/api/users?phone=${phone}`)
      if (res.ok) {
        const data = await res.json()
        setLoyaltyPoints(data.loyaltyPoints || 0)
      }
    } catch (error) {
      console.error('Error fetching loyalty points:', error)
    }
  }

  const handleRedeemPoints = (points: number) => {
    const maxAllowed = Math.min(100, loyaltyPoints, Math.floor(total / 50) * 100)
    const validPoints = points <= 50 ? 50 : 100
    const finalPoints = Math.min(validPoints, maxAllowed)
    setRedeemedPoints(finalPoints)
    if (finalPoints > 0) setShowConfetti(true)
  }

  const handleProceedToCheckout = () => {
    if (redeemedPoints > 0) {
      localStorage.setItem('loyaltyPointsRedeemed', redeemedPoints.toString())
    }
    router.push('/checkout')
  }

  const discount = redeemedPoints === 100 ? 50 : redeemedPoints === 50 ? 25 : 0
  const finalTotal = total - discount

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header settings={settings} />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-12">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 002 2v6a2 2 0 002 2z" />
              </svg>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
              <p className="mt-2 text-gray-600">Add some products to get started</p>
              <button
                onClick={() => router.push('/products')}
                className="mt-4 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700"
              >
                Continue Shopping
              </button>
            </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-20 h-20 relative">
                      <Image
                        src={item.images && item.images.length > 0 && item.images[0] ? item.images[0] : '/placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-gray-600">₹{item.discountPrice || item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.stock)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.stock)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">₹{(item.discountPrice || item.price) * item.quantity}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span>{itemCount}</span>
                </div>
                {user && loyaltyPoints > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600 mb-2">You have {loyaltyPoints} points</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Redeem:</span>
                      <select
                        value={redeemedPoints}
                        onChange={(e) => handleRedeemPoints(parseInt(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value={0}>0 pts (No discount)</option>
                        {loyaltyPoints >= 50 && <option value={50}>50 pts = ₹25 off</option>}
                        {loyaltyPoints >= 100 && <option value={100}>100 pts = ₹50 off</option>}
                      </select>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{total}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 animate-bounce">
                    <span>Loyalty Discount 🎉:</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span className={discount > 0 ? 'text-green-600' : ''}>₹{finalTotal}</span>
                </div>
              </div>
              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer settings={settings} />
      <Confetti show={showConfetti} duration={3000} />
    </div>
  )
}