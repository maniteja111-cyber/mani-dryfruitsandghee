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

  const minOrderForFreeDelivery = parseInt(settings.freeDeliveryMinOrder || '1500')
  const defaultDeliveryCharge = parseInt(settings.defaultDeliveryCharge || '100')
  const deliveryCharge = total >= minOrderForFreeDelivery ? 0 : defaultDeliveryCharge
  const discount = redeemedPoints === 100 ? 50 : redeemedPoints === 50 ? 25 : 0
  const finalTotal = total + deliveryCharge - discount

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header settings={settings} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-12 max-w-md">
            <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 002 2v6a2 2 0 002 2z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Add some products to get started</p>
            <button
              onClick={() => router.push('/products')}
              className="mt-6 bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 font-medium transition"
            >
              Continue Shopping
            </button>
          </div>
        </main>
        <Footer settings={settings} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header settings={settings} />
      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Shopping Cart <span className="text-gray-500 font-normal text-lg sm:text-xl">({itemCount} {itemCount === 1 ? 'Item' : 'Items'})</span>
            </h1>
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Product Image */}
                    <div className="w-full sm:w-24 md:w-28 lg:w-32 flex-shrink-0">
                      <div className="aspect-square relative bg-gray-50">
                        <Image
                          src={item.images && item.images.length > 0 && item.images[0] ? item.images[0] : '/placeholder.svg'}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100px, 128px"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg line-clamp-2 mb-1">
                          {item.name}
                        </h3>
                        {item.selectedVariant && (
                          <p className="text-gray-500 text-sm mb-2">{item.selectedVariant.size}</p>
                        )}
                        <p className="text-gray-600 text-sm font-medium mb-3">
                          ₹{(item.discountPrice || item.price)} <span className="text-gray-400 font-normal">/ {item.selectedVariant?.size || 'Pack'}</span>
                        </p>
                        
                        {/* Stock Status */}
                        {item.stock && item.stock > 0 && (
                          <p className="text-green-600 text-xs font-medium mb-2">✓ In Stock</p>
                        )}
                      </div>

                      {/* Mobile: Item Total with Remove Icon on same line */}
                      <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-lg">
                            ₹{(item.discountPrice || item.price) * item.quantity}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.8 15.1A2 2 0 0116.2 21H7.8a2 2 0 01-1.99-1.9L5 7m5 4v-5a2 2 0 014 0v5m-6 0h6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: Quantity and Price */}
                    <div className="hidden sm:flex sm:flex-col sm:items-end sm:justify-between p-4 sm:p-5">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-lg transition"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-12 h-10 flex items-center justify-center font-medium text-gray-900 border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-lg transition"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total with Remove Icon on same line */}
                      <div className="flex items-center justify-end gap-3 mt-4">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(item.discountPrice || item.price) * item.quantity}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 transition"
                          aria-label="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.8 15.1A2 2 0 0116.2 21H7.8a2 2 0 01-1.99-1.9L5 7m5 4v-5a2 2 0 014 0v5m-6 0h6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mobile: Quantity Selector */}
                    <div className="sm:hidden px-4 pb-4">
                      <div className="flex items-center justify-center border border-gray-200 rounded-lg w-32">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-lg transition"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-12 h-10 flex items-center justify-center font-medium text-gray-900 border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-lg transition"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 mt-6 lg:mt-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:sticky lg:top-24">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})</span>
                    <span className="font-medium text-gray-900">₹{total}</span>
                  </div>
                  
<div className="flex justify-between text-gray-600">
                        <span>Delivery</span>
                        <span className={deliveryCharge === 0 ? 'font-medium text-green-600' : 'font-medium text-gray-900'}>
                          {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
                        </span>
                      </div>
                      
                      {total < minOrderForFreeDelivery && (
                        <p className="text-xs text-orange-600">
                          Add ₹{minOrderForFreeDelivery - total} more for free delivery
                        </p>
                      )}

                  {user && loyaltyPoints > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-3">You have {loyaltyPoints} points available</p>
                      <select
                        value={redeemedPoints}
                        onChange={(e) => handleRedeemPoints(parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        <option value={0}>Redeem Points: No discount</option>
                        {loyaltyPoints >= 50 && <option value={50}>Redeem Points: 50 pts = ₹25 off</option>}
                        {loyaltyPoints >= 100 && <option value={100}>Redeem Points: 100 pts = ₹50 off</option>}
                      </select>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 animate-bounce">
                      <span>Loyalty Discount 🎉</span>
                      <span className="font-medium">-₹{discount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                    <span>Total</span>
                    <span className={discount > 0 ? 'text-green-600' : 'text-gray-900'}>₹{finalTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-yellow-600 text-white py-3.5 sm:py-4 rounded-lg font-semibold text-base hover:bg-yellow-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => router.push('/products')}
                  className="w-full mt-3 text-gray-600 font-medium text-sm hover:text-gray-900 transition"
                >
                  ← Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer settings={settings} />
      <Confetti show={showConfetti} duration={3000} />

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">₹{finalTotal}</p>
          </div>
          <button
            onClick={handleProceedToCheckout}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  )
}